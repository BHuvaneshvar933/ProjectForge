import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import * as notificationService from "./notification.service.js";

const normalizeProjectRole = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return null;
  return trimmed;
};

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
    throw new Error("You have already applied to this project");
  }

  // Match Score
  let matchScore = 0;

  if (user.skills && project.requiredSkills) {
    const userSkillIds = user.skills.map(s => s.toString());
    const projectSkillIds = project.requiredSkills.map(s => s.toString());

    const intersection = userSkillIds.filter(id =>
      projectSkillIds.includes(id)
    );

    const union = [...new Set([...userSkillIds, ...projectSkillIds])];

    matchScore = union.length > 0
      ? Math.round((intersection.length / union.length) * 100)
      : 0;
  }

  // Create Application
  const application = await Application.create({
    projectId,
    applicantId: userId,
    message,
    matchScore,
    status: "pending"
  });

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

export const getMyApplications = async (userId, query) => {
  const { page = 1, limit = 10 } = query;

  const skip = (page - 1) * limit;

  const filter = {
    applicantId: userId,
    isDeleted: false
  };

  const applications = await Application.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate({
      path: "projectId",
      select: "title status",
      populate: {
        path: "owner",
        select: "name"
      }
    });

  const total = await Application.countDocuments(filter);

  return {
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getProjectApplications = async (userId, projectId, query) => {
  const { page = 1, limit = 10 } = query;

  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  const skip = (page - 1) * limit;

  const filter = {
    projectId,
    isDeleted: false
  };

  const applications = await Application.find(filter)
    .sort({ matchScore: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate({
      path: "applicantId",
      select: "name skills stats",
      populate: {
        path: "skills",
        select: "name"
      }
    });

  const total = await Application.countDocuments(filter);

  return {
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const acceptApplication = async (ownerId, applicationId) => {
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

    // Assign a projectRole from openRoles (simple FIFO)
    let assignedRole = null;
    if (openRoles.length > 0) {
      assignedRole = openRoles.shift();
      assignedRole = normalizeProjectRole(assignedRole);
    }

    project.openRoles = openRoles;

    // Create Team document
    await Team.create(
      [{
        projectId: project._id,
        userId: applicant._id,
        role: "member",
        status: "active",
        projectRole: assignedRole || "Member",
      }],
      { session }
    );

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

  if (project.status === "archived") {
    throw new Error("Project is archived");
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
