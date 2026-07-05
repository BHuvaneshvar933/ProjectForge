import User from "../models/user.model.js";
import "../models/skill.model.js";
import Team from "../models/team.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";

export const getDeveloperJourneyStats = async (userId) => {
  const teams = await Team.find({ userId, status: "active" });
  const projectIds = teams.map((t) => t.projectId);

  const completedProjects = await Project.find({
    _id: { $in: projectIds },
    status: "completed",
  });

  let projectsCompleted = completedProjects.length;
  let challengesSolved = 0;
  let achievementsUnlocked = 0;
  const uniqueSkills = new Set();

  completedProjects.forEach((proj) => {
    if (proj.archiveData) {
      if (proj.archiveData.challenges) {
        challengesSolved += proj.archiveData.challenges.length;
      }
      if (proj.archiveData.achievements) {
        achievementsUnlocked += proj.archiveData.achievements.length;
      }
      if (proj.archiveData.skillsGained) {
        proj.archiveData.skillsGained.forEach((skill) => {
          uniqueSkills.add(skill.toString());
        });
      }
    }
  });

  const skillsMastered = uniqueSkills.size;

  const teamContributions = await Task.countDocuments({
    assignedTo: userId,
    status: "done",
  });

  return {
    projectsCompleted,
    challengesSolved,
    skillsMastered,
    achievementsUnlocked,
    teamContributions,
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

  return {
    ...user.toObject(),
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
    "skills",
    "availabilityHoursPerWeek",
    "portfolioLinks",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  const populated = await User.findById(userId)
    .populate("skills", "name category")
    .select("-password");

  return populated || user;
};

export const getPublicUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate("skills", "name category")
    .select("-password -email");

  if (!user || user.isActive === false) {
    throw new Error("User not found");
  }

  const developerJourney = await getDeveloperJourneyStats(userId);

  return {
    ...user.toObject(),
    developerJourney
  };
};

export const searchUsers = async (query) => {
  const { search = "", skills = "", limit = 12, excludeProjectUserIds = [] } = query;

  const limitNum = Number.isFinite(Number(limit)) ? Math.min(30, Math.max(1, Number(limit))) : 12;
  const skillIds = String(skills || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const filter = {
    isActive: true,
    deletedAt: null,
  };

  if (Array.isArray(excludeProjectUserIds) && excludeProjectUserIds.length > 0) {
    filter._id = { $nin: excludeProjectUserIds };
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

  const users = await User.find(filter)
    .populate("skills", "name category")
    .select("name email bio skills availabilityHoursPerWeek portfolioLinks stats createdAt")
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  return users;
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
