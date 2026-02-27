import Project from "../models/project.model.js";
import Team from "../models/team.model.js";


// CREATE PROJECT
export const createProject = async (userId, data) => {
  let {
    requiredSkills,
    teamSizeRequired,
    timeline
  } = data;

  // Business Validations

  if (!requiredSkills || requiredSkills.length === 0) {
    throw new Error("At least one required skill is needed");
  }

  if (teamSizeRequired < 2) {
    throw new Error("Team size must be at least 2");
  }

  if (timeline?.startDate && timeline?.endDate) {
    if (new Date(timeline.endDate) <= new Date(timeline.startDate)) {
      throw new Error("End date must be after start date");
    }
  }


  const project = await Project.create({
    ...data,
    owner: userId,
    currentTeamSize: 1,
    status: "recruiting",
    isDeleted: false
  });

  await Team.create({
    projectId: project._id,
    userId,
    role: "owner",
    status: "active"
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

  return project;
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
    .populate("userId", "name bio skills")
    .sort({ role: -1, joinedAt: 1 }); 

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