import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import { normalizeProjectRole } from "./project.core.service.js";

// GET PROJECT TEAM
export const getProjectTeam = async (projectId, requesterId) => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: false
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const requesterMembership = await Team.findOne({
    projectId,
    userId: requesterId,
    status: "active",
    isDeleted: false,
  }).select("_id");

  if (!requesterMembership) {
    throw new Error("Access denied");
  }

  const teamMembers = await Team.find({
    projectId,
    status: "active",
    isDeleted: false
  })
    .populate("userId", "name avatar")
    .sort({ role: -1, joinedAt: 1 }); 

  // Backward compatibility: ensure projectRole is always present in response
  for (const m of teamMembers) {
    const normalized = normalizeProjectRole(m.projectRole);
    if (!normalized) {
      m.projectRole = m.role === "owner" ? "Project Owner" : "Member";
    }
  }

  return teamMembers;
};

// GET JOINED PROJECTS
export const getJoinedProjects = async (userId) => {
  const memberships = await Team.find({
    userId,
    status: "active",
    isDeleted: false
  }).select("projectId");

  const projectIds = memberships.map(m => m.projectId);

  const projects = await Project.find({
    _id: { $in: projectIds },
    owner: { $ne: userId },
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .populate("owner", "name")
    .populate("requiredSkills", "name");

  return projects;
};

export const leaveProject = async (userId, projectId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findById(projectId).session(session);

    if (!project || project.isDeleted) {
      throw new Error("Project not found");
    }

    const membership = await Team.findOne({
      projectId,
      userId,
      status: "active"
    }).session(session);

    if (!membership) {
      throw new Error("You are not an active member of this project");
    }

    if (membership.role === "owner") {
      throw new Error("Project owner cannot leave the project");
    }

    // Update membership
    membership.status = "left";
    membership.leftAt = new Date();
    await membership.save({ session });

    // Update project team size
    project.currentTeamSize -= 1;

    if (
      project.status === "in-progress" &&
      project.currentTeamSize < project.teamSizeRequired
    ) {
      project.status = "recruiting";
    }

    await project.save({ session });

    // Update user stats
    const user = await User.findById(userId).session(session);

    if (user?.stats) {
      user.stats.projectsActive -= 1;
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return project;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const saveMyReflections = async (projectId, userId, reflections) => {
  const membership = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  });

  if (!membership) {
    throw new Error("You are not an active member of this project");
  }

  membership.reflections = reflections;
  await membership.save();
  return membership;
};
