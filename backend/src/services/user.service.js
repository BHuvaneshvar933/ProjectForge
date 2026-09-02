import User from "../models/user.model.js";
import "../models/skill.model.js";
import Team from "../models/team.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Application from "../models/application.model.js";

export const getDeveloperJourneyStats = async (userId) => {
  const teams = await Team.find({ userId, status: "active" });
  const projectIds = teams.map((t) => t.projectId);

  const activeProjectsCount = await Project.countDocuments({
    _id: { $in: projectIds },
    status: { $in: ["recruiting", "in-progress"] },
  });

  const completedProjects = await Project.find({
    _id: { $in: projectIds },
    status: "completed",
  });

  let projectsCompleted = completedProjects.length;
  let challengesSolved = 0;
  const uniqueSkills = new Set();

  teams.forEach((team) => {
    if (team.journey) {
      if (team.journey.challenges) {
        challengesSolved += team.journey.challenges.length;
      }
      if (team.journey.skills) {
        team.journey.skills.forEach((s) => {
          if (s.skill) uniqueSkills.add(s.skill.toString());
        });
      }
    }
  });

  const skillsMastered = uniqueSkills.size;

  const teamContributions = await Task.countDocuments({
    assignedTo: userId,
    status: "done",
  });

  const bugsFixed = await Task.countDocuments({
    assignedTo: userId,
    status: "done",
    issueType: "bug",
  });

  const user = await User.findById(userId);

  const gamifiedBadges = [];
  if (teamContributions >= 1) {
    gamifiedBadges.push({ id: "first_blood", name: "First Blood", icon: "🩸", description: "Complete your first task" });
  }
  if (teamContributions >= 10) {
    gamifiedBadges.push({ id: "task_master", name: "Task Master", icon: "⚡", description: "Complete 10 tasks" });
  }
  if (projectsCompleted >= 1) {
    gamifiedBadges.push({ id: "project_pioneer", name: "Project Pioneer", icon: "🚀", description: "Complete your first project" });
  }
  if (projectsCompleted >= 5) {
    gamifiedBadges.push({ id: "veteran_builder", name: "Veteran Builder", icon: "🏛️", description: "Complete 5 projects" });
  }
  if (bugsFixed >= 5) {
    gamifiedBadges.push({ id: "bug_squasher", name: "Bug Squasher", icon: "🐛", description: "Fix 5 bugs" });
  }
  if (user?.endorsements?.length > 0) {
    gamifiedBadges.push({ id: "team_favorite", name: "Team Favorite", icon: "🌟", description: "Receive a peer endorsement" });
  }

  const achievementsUnlocked = gamifiedBadges.length;

  const applicationsSent = await Application.countDocuments({
    applicantId: userId,
    applicationType: "application",
  });

  const applicationsAccepted = await Application.countDocuments({
    applicantId: userId,
    applicationType: "application",
    status: "accepted",
  });

  const acceptanceRate = applicationsSent > 0 
    ? Number(((applicationsAccepted / applicationsSent) * 100).toFixed(0)) 
    : 0;

  return {
    projectsActive: activeProjectsCount,
    projectsCompleted,
    tasksCompleted: teamContributions,
    applicationsSent,
    applicationsAccepted,
    acceptanceRate,
    challengesSolved,
    skillsMastered,
    achievementsUnlocked,
    teamContributions,
    gamifiedBadges
  };
};

export const getMyProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate("skills", "name category")
    .select("-password");

  if (!user || user.isActive === false) {
    throw new Error("User not found");
  }

  const developerJourney = await getDeveloperJourneyStats(userId);

  const userObj = user.toObject();
  if (userObj.stats) {
    userObj.stats.projectsActive = developerJourney.projectsActive;
    userObj.stats.projectsCompleted = developerJourney.projectsCompleted;
    userObj.stats.tasksCompleted = developerJourney.tasksCompleted;
    userObj.stats.applicationsSent = developerJourney.applicationsSent;
    userObj.stats.applicationsAccepted = developerJourney.applicationsAccepted;
    userObj.stats.acceptanceRate = developerJourney.acceptanceRate;
  }

  return {
    ...userObj,
    developerJourney
  };
};

export const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const allowedFields = [
    "name",
    "bio",
    "headline",
    "skills",
    "availabilityHoursPerWeek",
    "structuredAvailability",
    "education",
    "experience",
    "achievements",
    "featuredProjects",
    "portfolioLinks",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  return getMyProfile(userId);
};

export const getPublicUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate("skills", "name category")
    .select("-password -email");

  if (!user || user.isActive === false) {
    throw new Error("User not found");
  }

  const developerJourney = await getDeveloperJourneyStats(userId);

  const userObj = user.toObject();

  // Populate featured projects with Project details and Team role
  if (userObj.featuredProjects && userObj.featuredProjects.length > 0) {
    const projectIds = userObj.featuredProjects.map(fp => fp.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } }).populate('requiredSkills');
    const teams = await Team.find({ userId, projectId: { $in: projectIds } });

    userObj.featuredProjects = userObj.featuredProjects.map(fp => {
      const proj = projects.find(p => String(p._id) === String(fp.projectId));
      const team = teams.find(t => String(t.projectId) === String(fp.projectId));
      
      return {
        ...fp,
        project: proj ? {
          _id: proj._id,
          title: proj.title,
          description: proj.description,
          status: proj.status,
          githubUrl: proj.githubIntegration?.isConnected && proj.githubIntegration?.repoName ? `https://github.com/${proj.githubIntegration.repoName}` : proj.archiveData?.deliverables?.sourceCodeUrl,
          liveUrl: proj.archiveData?.deliverables?.demoVideoUrl,
          deliverables: proj.archiveData?.deliverables,
          skills: proj.requiredSkills,
          coverImage: proj.coverImage
        } : null,
        teamRole: team ? team.projectRole : null,
        contributions: team?.journey?.contributions || []
      };
    }).filter(fp => fp.project != null).sort((a, b) => a.order - b.order);
  }

  if (userObj.stats) {
    userObj.stats.projectsActive = developerJourney.projectsActive;
    userObj.stats.projectsCompleted = developerJourney.projectsCompleted;
    userObj.stats.tasksCompleted = developerJourney.tasksCompleted;
    // Omit acceptanceRate and applications data for public profile
  }

  return {
    ...userObj,
    developerJourney
  };
};

export const searchUsers = async (query) => {
  const { search = "", skills = "", page = 1, limit = 12, projectId = "" } = query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Number.isFinite(Number(limit)) ? Math.min(30, Math.max(1, Number(limit))) : 12;
  const skip = (pageNum - 1) * limitNum;

  const skillIds = String(skills || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const filter = {
    isActive: true,
    deletedAt: null,
  };

  const excludeUserIds = [];

  if (projectId) {
    const activeTeamMembers = await Team.find({ projectId, status: "active" }).select("userId");
    const pendingApps = await Application.find({ 
      projectId, 
      status: "pending", 
      isDeleted: false 
    }).select("applicantId");

    activeTeamMembers.forEach(m => excludeUserIds.push(m.userId.toString()));
    pendingApps.forEach(a => excludeUserIds.push(a.applicantId.toString()));
  }

  if (excludeUserIds.length > 0) {
    filter._id = { $nin: excludeUserIds };
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    filter.$or = [
      { name: { $regex: trimmedSearch, $options: "i" } },
      { bio: { $regex: trimmedSearch, $options: "i" } },
    ];
  }

  if (skillIds.length > 0) {
    filter.skills = { $in: skillIds };
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .populate("skills", "name category")
    .select("name email bio skills availabilityHoursPerWeek portfolioLinks stats createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1
    }
  };
};

export const endorseUser = async (userId, endorserId, data) => {
  if (String(userId) === String(endorserId)) {
    throw new Error("You cannot endorse yourself");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const { project, text, skills } = data;

  // Ensure they haven't already endorsed for this project
  const existing = user.endorsements?.find(
    e => String(e.endorsedBy) === String(endorserId) && String(e.project) === String(project)
  );
  if (existing) {
    throw new Error("You have already endorsed this user for this project");
  }

  user.endorsements.push({
    endorsedBy: endorserId,
    project,
    text,
    skills: skills || []
  });

  await user.save();
  
  return user.populate({
    path: "endorsements.endorsedBy",
    select: "name email portfolioLinks"
  });
};
