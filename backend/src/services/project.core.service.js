import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import { calculateUserReliability } from "./reliability.service.js";

export const normalizeProjectRole = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return null;
  return trimmed;
};

export const normalizeOpenRoles = (value) => {
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

// Let's create a brand new project and set the creator as the owner.
export const createProject = async (userId, data) => {
  const {
    requiredSkills,
    teamSizeRequired,
    timeline,
    openRoles,
    ownerProjectRole,
    ...projectData
  } = data;

  if (!requiredSkills || requiredSkills.length === 0) {
    throw new Error("At least one required skill is needed");
  }

  if (teamSizeRequired < 2) {
    throw new Error("Team size must be at least 2");
  }

  const normalizedOpenRoles = normalizeOpenRoles(openRoles);

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

  const generateKey = (title) => {
    if (!title) return "PRJ";
    const letters = title.split(" ").map(w => w[0]).join("").toUpperCase().replace(/[^A-Z]/g, '');
    return letters.slice(0, 4) || "PRJ";
  };
  const key = generateKey(projectData.title);

  const owner = await import("../models/user.model.js").then(m => m.default).then(User => User.findById(userId).select("name"));
  const ownerName = owner ? owner.name : "Owner";

  const project = await Project.create({
    ...projectData,
    requiredSkills,
    teamSizeRequired,
    timeline,
    openRoles: normalizedOpenRoles,
    owner: userId,
    key,
    lastTaskNumber: 0,
    currentTeamSize: 1,
    status: "recruiting",
    isDeleted: false,
    archiveData: {
      timelineEvents: [{
        eventType: "creation",
        title: "Project Created",
        description: `${ownerName} founded the project.`,
        date: new Date()
      }]
    }
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

// Fetch a specific project by its ID, complete with its team and skills.
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

// Browse all public projects. Perfect for the explore page!
export const browseProjects = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    projectType,
    search,
    userId
  } = query;

  const filter = {
    isDeleted: false,
    visibility: "public"
  };

  if (status) {
    filter.status = status;
  } else {
    filter.status = "recruiting";
  }

  if (projectType) filter.projectType = projectType;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  if (userId) {
    const teams = await Team.find({ userId, status: "active" });
    const projectIds = teams.map((t) => t.projectId);
    filter._id = { $in: projectIds };
  }

  const skip = (page - 1) * limit;

  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("owner", "name")
    .populate("requiredSkills", "name")
    .lean();

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

// Get all projects that I own.
export const getMyProjects = async (userId) => {
  return await Project.find({
    owner: userId
  })
    .sort({ createdAt: -1 })
    .populate("owner", "name")
    .populate("requiredSkills", "name");
};

// Update project details. Only the owner can do this!
export const updateProject = async (projectId, userId, updateData) => {
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (updateData.__v !== undefined && project.__v !== updateData.__v) {
    const err = new Error("This project was updated by another user.");
    err.name = "VersionError";
    throw err;
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  const previousStatus = project.status;

  Object.assign(project, updateData);

  await project.save();

  if (previousStatus !== "completed" && project.status === "completed") {
    Team.find({ projectId: project._id }).distinct("userId").then(userIds => {
      userIds.forEach(uId => {
        calculateUserReliability(uId).catch(err => {
          console.error(`Failed to calculate reliability for user ${uId} upon project completion:`, err);
        });
      });
    }).catch(err => console.error("Error fetching team for reliability calculation:", err));
  }

  return project;
};

// Close recruitment so no one else can apply.
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



export const updateArchiveData = async (userId, projectId, data) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!project) throw new Error("Project not found");

  if (data.__v !== undefined && project.__v !== data.__v) {
    const err = new Error("This project was updated by another user.");
    err.name = "VersionError";
    throw err;
  }

  const teamMember = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  });

  if (!teamMember) {
    throw new Error("Only team members can update archive data");
  }

  if (!project.archiveData) {
    project.archiveData = { timelineEvents: [], deliverables: {} };
  }

  if (data.type === "timeline") {
    project.archiveData.timelineEvents.push(data.event);
  } else if (data.type === "deliverables") {
    project.archiveData.deliverables = {
      ...project.archiveData.deliverables,
      ...data.deliverables
    };
  }

  await project.save();
  return project;
};

export const updatePersonalJourney = async (userId, projectId, data) => {
  const teamMember = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  });

  if (!teamMember) {
    throw new Error("Only active team members can update personal journey data");
  }

  if (!teamMember.journey) {
    teamMember.journey = { contributions: [], challenges: [], skills: [], learnings: [], evidence: [] };
  }

  if (data.type === "add_contribution") {
    teamMember.journey.contributions.push(data.contribution);
  } else if (data.type === "delete_contribution") {
    teamMember.journey.contributions.splice(data.index, 1);
  } else if (data.type === "add_challenge") {
    teamMember.journey.challenges.push(data.challenge);
  } else if (data.type === "delete_challenge") {
    teamMember.journey.challenges.splice(data.index, 1);
  } else if (data.type === "add_skill") {
    teamMember.journey.skills.push(data.skill);
  } else if (data.type === "delete_skill") {
    teamMember.journey.skills.splice(data.index, 1);
  } else if (data.type === "add_learning") {
    teamMember.journey.learnings.push(data.learning);
  } else if (data.type === "delete_learning") {
    teamMember.journey.learnings.splice(data.index, 1);
  } else if (data.type === "add_evidence") {
    teamMember.journey.evidence.push(data.evidence);
  } else if (data.type === "delete_evidence") {
    teamMember.journey.evidence.splice(data.index, 1);
  }

  await teamMember.save();
  return teamMember.journey;
};

export const connectGitHub = async (userId, projectId, payload) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  // Only owner or member can connect
  const member = await Team.findOne({ projectId, userId });
  if (!member && String(project.owner) !== String(userId)) {
    throw { status: 403, message: "Only team members can connect GitHub" };
  }

  project.githubIntegration = {
    isConnected: true,
    repoName: payload.repoName,
    accessToken: payload.accessToken || "",
  };

  await project.save();
  return project;
};

export const disconnectGitHub = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  const member = await Team.findOne({ projectId, userId });
  if (!member && String(project.owner) !== String(userId)) {
    throw { status: 403, message: "Only team members can disconnect GitHub" };
  }

  project.githubIntegration = {
    isConnected: false,
    repoName: null,
    accessToken: null,
  };

  await project.save();
  return project;
};

export const getProjectReleases = async (projectId) => {
  const Release = (await import("../models/release.model.js")).default;
  const Task = (await import("../models/task.model.js")).default;
  
  const releases = await Release.find({ projectId, isDeleted: false }).sort({ createdAt: -1 }).lean();
  
  // Compute progress for each release
  for (const release of releases) {
    const tasks = await Task.find({ releaseId: release._id, isDeleted: false });
    if (tasks.length === 0) {
      release.progress = 0;
    } else {
      const completed = tasks.filter(t => t.status === "done").length;
      release.progress = Math.round((completed / tasks.length) * 100);
    }
  }
  
  return releases;
};

export const createProjectRelease = async (userId, projectId, payload) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  
  const member = await Team.findOne({ projectId, userId, status: "active", isDeleted: false });
  if (!member && String(project.owner) !== String(userId)) {
    throw new Error("Only team members can create releases");
  }

  const Release = (await import("../models/release.model.js")).default;
  const release = await Release.create({
    projectId,
    version: payload.version,
    status: payload.status || "UNRELEASED",
    progress: payload.progress || 0,
    startDate: payload.startDate || null,
    releaseDate: payload.releaseDate || null,
    description: payload.description || "",
  });

  return release;
};

export const updateProjectRelease = async (userId, projectId, releaseId, payload) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  
  const member = await Team.findOne({ projectId, userId, status: "active", isDeleted: false });
  if (!member && String(project.owner) !== String(userId)) {
    throw new Error("Only team members can update releases");
  }

  const Release = (await import("../models/release.model.js")).default;
  const release = await Release.findOne({ _id: releaseId, projectId, isDeleted: false });
  if (!release) throw new Error("Release not found");

  if (payload.__v !== undefined && release.__v !== payload.__v) {
    const err = new Error("This release was updated by another user.");
    err.name = "VersionError";
    throw err;
  }

  const allowedFields = ["version", "status", "startDate", "releaseDate", "description"];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      release[field] = payload[field];
    }
  });

  await release.save();
  return release;
};
