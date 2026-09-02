import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import * as notificationService from "./notification.service.js";
import { calculateMatchScore, normalizeProjectRole, pickAssignedRole } from "./applications.helpers.js";
import { getIO } from "../sockets/socket.js";

export const applyToProject = async (userId, data) => {
  const { projectId, message = "" } = data;

  // Validate User
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error("Account is inactive");
  }

  // Validate Project
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.isDeleted) {
    throw new Error("Project is no longer available");
  }

  if (project.status !== "recruiting") {
    throw new Error("Project is not accepting applications");
  }

  if (project.currentTeamSize >= project.teamSizeRequired) {
    throw new Error("Project team is already full");
  }

  //Cannot apply to own project
  if (project.owner.toString() === userId.toString()) {
    throw new Error("Cannot apply to your own project");
  }

  // Check active team membership
  const existingMember = await Team.findOne({
    projectId,
    userId,
    status: "active"
  });

  if (existingMember) {
    throw new Error("You are already a member of this team");
  }

  // Check existing application
  const existingApplication = await Application.findOne({
    projectId,
    applicantId: userId
  });

  if (existingApplication) {
    if (["pending", "accepted"].includes(existingApplication.status)) {
      throw new Error("You already have an active or pending application for this project");
    }
  }

  const matchScore = calculateMatchScore(user, project);

  let application;
  if (existingApplication) {
    // Re-apply by updating the existing rejected/withdrawn application
    existingApplication.status = "pending";
    existingApplication.message = message;
    existingApplication.matchScore = matchScore;
    existingApplication.applicationType = "application";
    existingApplication.rejectionReason = null;
    existingApplication.reviewedAt = null;
    existingApplication.reviewedBy = null;
    await existingApplication.save();
    
    await Application.updateOne({ _id: existingApplication._id }, { createdAt: new Date() });
    existingApplication.createdAt = new Date();
    
    application = existingApplication;
  } else {
    // Create new Application
    application = await Application.create({
      projectId,
      applicantId: userId,
      message,
      matchScore,
      status: "pending",
      applicationType: "application",
    });
  }

  // Update user stats
  user.stats.applicationsSent += 1;
  await user.save();
  await notificationService.createNotification({
  userId: project.owner,
  type: "application_received",
  title: "New Application Received",
  message: `${user.name} applied to ${project.title}`,
  actionUrl: `/projects/${project._id}/applications`
});

  return application;
};

export const inviteUserToProject = async (ownerId, data) => {
  const { projectId, userId, message = "", invitedRole = null } = data;

  const [project, user] = await Promise.all([
    Project.findById(projectId),
    User.findById(userId),
  ]);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== ownerId.toString()) {
    throw new Error("Not authorized");
  }

  if (project.status !== "recruiting") {
    throw new Error("Project is not recruiting");
  }

  if (project.currentTeamSize >= project.teamSizeRequired) {
    throw new Error("Project team is already full");
  }

  if (!user || !user.isActive) {
    throw new Error("User not found");
  }

  if (String(user._id) === String(ownerId)) {
    throw new Error("Cannot invite yourself");
  }

  const existingMember = await Team.findOne({ projectId, userId, status: "active" });
  if (existingMember) {
    throw new Error("User is already a team member");
  }

  let existingApplication = await Application.findOne({
    projectId,
    applicantId: userId,
    isDeleted: false,
  });
  if (existingApplication && ["pending", "accepted"].includes(existingApplication.status)) {
    throw new Error("There is already an active or pending application for this user");
  }

  // Rate Limiting
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const inviteCount = await Application.countDocuments({
    invitedBy: ownerId,
    applicationType: "invitation",
    createdAt: { $gte: twentyFourHoursAgo }
  });

  if (inviteCount >= 20) {
    throw new Error("Daily invitation limit reached (20 per day)");
  }

  const matchScore = calculateMatchScore(user, project);
  let application;
  if (existingApplication) {
    existingApplication.status = "pending";
    existingApplication.applicationType = "invitation";
    existingApplication.invitedBy = ownerId;
    existingApplication.invitedRole = normalizeProjectRole(invitedRole);
    existingApplication.message = message;
    existingApplication.matchScore = matchScore;
    existingApplication.reviewedAt = null;
    existingApplication.reviewedBy = null;
    existingApplication.rejectionReason = null;
    await existingApplication.save();
    
    await Application.updateOne({ _id: existingApplication._id }, { createdAt: new Date() });
    existingApplication.createdAt = new Date();
    
    application = existingApplication;
  } else {
    application = await Application.create({
      projectId,
      applicantId: userId,
      invitedBy: ownerId,
      invitedRole: normalizeProjectRole(invitedRole),
      message,
      matchScore,
      status: "pending",
      applicationType: "invitation",
    });
  }

  await notificationService.createNotification({
    userId: user._id,
    type: "project_invitation",
    title: "Project Invitation",
    message: `You were invited to join ${project.title}`,
    actionUrl: "/applications/sent",
  });

  return application;
};

export const acceptApplication = async (ownerId, applicationId, data = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get application
    const application = await Application.findById(applicationId).session(session);

    if (!application || application.isDeleted) {
      throw new Error("Application not found");
    }

    if (application.status !== "pending") {
      throw new Error("Application is not pending");
    }

    // Get project
    const project = await Project.findById(application.projectId).session(session);

    if (!project || project.isDeleted) {
      throw new Error("Project not found");
    }

    if (project.owner.toString() !== ownerId.toString()) {
      throw new Error("Not authorized");
    }

    if (project.status !== "recruiting") {
      throw new Error("Project is not accepting applications");
    }

    if (project.currentTeamSize >= project.teamSizeRequired) {
      throw new Error("Project team is already full");
    }

    const openRoles = Array.isArray(project.openRoles) ? project.openRoles : [];

    // Consistency guard: openRoles should never exceed remaining capacity
    if (openRoles.length + project.currentTeamSize > project.teamSizeRequired) {
      throw new Error("Project roles exceed team capacity");
    }

    // Get applicant
    const applicant = await User.findById(application.applicantId).session(session);

    if (!applicant || !applicant.isActive) {
      throw new Error("Applicant not found or inactive");
    }

    // Double-check active membership
    const existingMember = await Team.findOne({
      projectId: project._id,
      userId: applicant._id,
      status: "active"
    }).session(session);

    if (existingMember) {
      throw new Error("User already a team member");
    }

    // Update application
    application.status = "accepted";
    application.reviewedAt = new Date();
    application.reviewedBy = ownerId;
    await application.save({ session });

    const assignedRole = pickAssignedRole({
      preferredRole: data.projectRole,
      invitedRole: application.invitedRole,
      project,
    });

    // Create Team document
    await Team.create(
      [{
        projectId: project._id,
        userId: applicant._id,
        role: "member",
        status: "active",
        projectRole: assignedRole,
      }],
      { session }
    );

    if (!project.archiveData) {
      project.archiveData = { timelineEvents: [], challenges: [], lessonsLearned: [], deliverables: {} };
    }
    project.archiveData.timelineEvents.push({
      eventType: "team_change",
      title: "Team Member Joined",
      description: `${applicant.name} joined the project as ${assignedRole || "a member"}.`,
      date: new Date()
    });

    // Update project team size
    project.currentTeamSize += 1;

    // If team full -> move to in-progress
    if (project.currentTeamSize >= project.teamSizeRequired) {
      project.status = "in-progress";

      // Auto-reject remaining pending applications
      await Application.updateMany(
        {
          projectId: project._id,
          status: "pending"
        },
        {
          $set: {
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: ownerId,
            rejectionReason: "Team capacity reached"
          }
        },
        { session }
      );
    }

    await project.save({ session });

    // Update applicant stats
    if (!applicant.stats) {
      applicant.stats = {
        projectsCompleted: 0,
        projectsActive: 0,
        tasksCompleted: 0,
        applicationsSent: 0,
        applicationsAccepted: 0,
        acceptanceRate: 0
      };
    }

    applicant.stats.applicationsAccepted += 1;
    applicant.stats.projectsActive += 1;

    // Recalculate acceptance rate
    if (applicant.stats.applicationsSent > 0) {
      applicant.stats.acceptanceRate =
        applicant.stats.applicationsAccepted /
        applicant.stats.applicationsSent;
    }

    await applicant.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    await notificationService.createNotification({
  userId: application.applicantId,
  type: "application_accepted",
  title: "Application Accepted",
  message: `You have been accepted to ${project.title}`,
  actionUrl: `/projects/${project._id}`
});

    return project;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const respondToInvitation = async (userId, applicationId, data = {}) => {
  const { action } = data;
  if (!["accept", "reject"].includes(action)) {
    throw new Error("Invalid invitation response");
  }

  if (action === "reject") {
    const application = await Application.findById(applicationId);

    if (!application || application.isDeleted || application.applicationType !== "invitation") {
      throw new Error("Invitation not found");
    }
    if (String(application.applicantId) !== String(userId)) {
      throw new Error("Not authorized");
    }
    if (application.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    application.status = "rejected";
    application.reviewedAt = new Date();
    application.reviewedBy = userId;
    await application.save();

    const project = await Project.findById(application.projectId).select("title owner").lean();
    if (project?.owner) {
      await notificationService.createNotification({
        userId: project.owner,
        type: "invitation_rejected",
        title: "Invitation Declined",
        message: `A user declined your invitation to ${project.title}`,
        actionUrl: `/projects/${application.projectId}`,
      });
      try {
        getIO().to(`user-${project.owner}`).emit("application-updated", application);
      } catch (e) {
        console.error("Socket emit failed", e.message);
      }
    }
    return application;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const application = await Application.findById(applicationId).session(session);

    if (!application || application.isDeleted || application.applicationType !== "invitation") {
      throw new Error("Invitation not found");
    }
    if (String(application.applicantId) !== String(userId)) {
      throw new Error("Not authorized");
    }
    if (application.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    const project = await Project.findById(application.projectId).session(session);
    if (!project || project.isDeleted) {
      throw new Error("Project not found");
    }
    if (project.status !== "recruiting") {
      throw new Error("Project is not accepting members right now");
    }
    if (project.currentTeamSize >= project.teamSizeRequired) {
      throw new Error("Project team is already full");
    }

    const applicant = await User.findById(application.applicantId).session(session);
    if (!applicant || !applicant.isActive) {
      throw new Error("User not found or inactive");
    }

    const existingMember = await Team.findOne({
      projectId: project._id,
      userId: applicant._id,
      status: "active",
    }).session(session);
    if (existingMember) {
      throw new Error("User already a team member");
    }

    application.status = "accepted";
    application.reviewedAt = new Date();
    application.reviewedBy = userId;
    await application.save({ session });

    const assignedRole = pickAssignedRole({
      invitedRole: application.invitedRole,
      project,
    });

    await Team.create(
      [{
        projectId: project._id,
        userId: applicant._id,
        role: "member",
        status: "active",
        projectRole: assignedRole,
      }],
      { session }
    );

    project.currentTeamSize += 1;
    if (project.currentTeamSize >= project.teamSizeRequired) {
      project.status = "in-progress";
    }

    if (!project.archiveData) {
      project.archiveData = { timelineEvents: [], challenges: [], lessonsLearned: [], deliverables: {} };
    }
    project.archiveData.timelineEvents.push({
      eventType: "team_change",
      title: "Team Member Joined",
      description: `${applicant.name} joined the project as ${assignedRole || "a member"}.`,
      date: new Date()
    });

    await project.save({ session });

    await session.commitTransaction();
    session.endSession();

    await notificationService.createNotification({
      userId: project.owner,
      type: "invitation_accepted",
      title: "Invitation Accepted",
      message: `${applicant.name} accepted your invitation to ${project.title}`,
      actionUrl: `/projects/${project._id}`,
    });

    try {
      getIO().to(`user-${project.owner}`).emit("application-updated", application);
    } catch (e) {
      console.error("Socket emit failed", e.message);
    }

    return application;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const rejectApplication = async (ownerId, applicationId, data) => {
  const { rejectionReason = null } = data;

  // Get application
  const application = await Application.findById(applicationId);

  if (!application || application.isDeleted) {
    throw new Error("Application not found");
  }

  if (application.status !== "pending") {
    throw new Error("Application is not pending");
  }

  // Get project
  const project = await Project.findById(application.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== ownerId.toString()) {
    throw new Error("Not authorized");
  }

  if (project.status === "completed") {
    throw new Error("Project is completed");
  }

  // Update application
  application.status = "rejected";
  application.rejectionReason = rejectionReason;
  application.reviewedAt = new Date();
  application.reviewedBy = ownerId;

  await application.save();
  await notificationService.createNotification({
  userId: application.applicantId,
  type: "application_rejected",
  title: "Application Rejected",
  message: rejectionReason
    ? `Your application was rejected: ${rejectionReason}`
    : "Your application was not accepted",
  actionUrl: `/applications/sent`
});

  return application;
};

export const withdrawApplication = async (userId, applicationId) => {
  const application = await Application.findById(applicationId);

  if (!application || application.isDeleted) {
    throw new Error("Application not found");
  }

  if (application.applicantId.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  if (application.status !== "pending") {
    throw new Error("Application cannot be withdrawn");
  }

  application.status = "withdrawn";
  application.reviewedAt = new Date();

  await application.save();

  return application;
};
