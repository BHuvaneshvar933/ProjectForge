import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

const normalizeProjectRole = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return null;
  return trimmed;
};

const normalizeOpenRoles = (value) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error("openRoles must be an array of strings");
  }

  const roles = value
    .map((r) => (typeof r === "string" ? r.trim() : ""))
    .filter((r) => r.length > 0);

  for (const r of roles) {
    if (r.length < 2 || r.length > 50) {
      throw new Error("Each open role must be 2-50 characters");
    }
  }

  return roles;
};

// CREATE PROJECT
export const createProject = async (userId, data) => {
  const {
    requiredSkills,
    teamSizeRequired,
    timeline,
    openRoles,
    ownerProjectRole,
    ...projectData
  } = data;

  // Business Validations

  if (!requiredSkills || requiredSkills.length === 0) {
    throw new Error("At least one required skill is needed");
  }

  if (teamSizeRequired < 2) {
    throw new Error("Team size must be at least 2");
  }

  const normalizedOpenRoles = normalizeOpenRoles(openRoles);

  // Owner is always 1 member; openRoles represent remaining slots
  if (normalizedOpenRoles.length > teamSizeRequired - 1) {
    throw new Error("openRoles cannot exceed teamSizeRequired - 1");
  }

  if (normalizedOpenRoles.length + 1 > teamSizeRequired) {
    throw new Error("openRoles + currentTeamSize exceeds teamSizeRequired");
  }

  const normalizedOwnerProjectRole =
    normalizeProjectRole(ownerProjectRole) || "Project Owner";

  if (timeline?.startDate && timeline?.endDate) {
    if (new Date(timeline.endDate) <= new Date(timeline.startDate)) {
      throw new Error("End date must be after start date");
    }
  }


  const project = await Project.create({
    ...projectData,
    requiredSkills,
    teamSizeRequired,
    timeline,
    openRoles: normalizedOpenRoles,
    owner: userId,
    currentTeamSize: 1,
    status: "recruiting",
    isDeleted: false
  });

  await Team.create({
    projectId: project._id,
    userId,
    role: "owner",
    status: "active",
    projectRole: normalizedOwnerProjectRole,
  });

  return project;
};


// GET PROJECT BY ID
export const getProjectById = async (projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: false
  })
    .populate("owner", "name bio")
    .populate("requiredSkills", "name");

  if (!project) {
    throw new Error("Project not found");
  }

  const teamMembers = await Team.find({
    projectId,
    status: "active",
    isDeleted: false,
  })
    .populate("userId", "name avatar")
    .sort({ role: -1, joinedAt: 1 });

  const team = teamMembers.map((m) => ({
    name: m.userId?.name,
    avatar: m.userId?.avatar,
    role: m.role,
    projectRole:
      normalizeProjectRole(m.projectRole) ||
      (m.role === "owner" ? "Project Owner" : "Member"),
  }));

  const openRolesSafe = Array.isArray(project.openRoles)
    ? project.openRoles
        .map((r) => (typeof r === "string" ? r.trim() : ""))
        .filter((r) => r.length > 0)
    : [];

  return {
    ...project.toObject(),
    team,
    openRoles: openRolesSafe,
  };
};


// BROWSE PROJECTS (PUBLIC)
export const browseProjects = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    projectType,
    search
  } = query;

  const filter = {
    isDeleted: false,
    visibility: "public",
    status: { $ne: "archived" }   
  };

  if (status) filter.status = status;
  if (projectType) filter.projectType = projectType;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;

  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("owner", "name")
    .populate("requiredSkills", "name");

  const total = await Project.countDocuments(filter);

  return {
    projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};


// GET MY PROJECTS
export const getMyProjects = async (userId) => {
  return await Project.find({
    owner: userId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};


// UPDATE PROJECT
export const updateProject = async (projectId, userId, updateData) => {
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  Object.assign(project, updateData);

  await project.save();

  return project;
};


// CLOSE RECRUITMENT
export const closeRecruitment = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  project.status = "in-progress";
  await project.save();

  return project;
};


// ARCHIVE PROJECT
export const archiveProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  project.status = "archived";
  project.isDeleted = true;       
  project.deletedAt = new Date();

  await project.save();

  return project;
};

// GET PROJECT TEAM
export const getProjectTeam = async (projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: false
  });

  if (!project) {
    throw new Error("Project not found");
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
