import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import Application from "../models/application.model.js";
import User from "../models/user.model.js";

// GET PROJECT RECOMMENDATIONS (Jaccard similarity)
// Rules:
// - Only public + recruiting
// - Exclude projects owned by requester
// - Exclude projects requester already joined (active team membership)
// - Exclude projects requester already applied to (any non-deleted application)
export const getProjectRecommendations = async ({ userId, limit = 5 }) => {
  const lim = Number.isFinite(Number(limit)) ? Math.min(20, Math.max(1, Number(limit))) : 5;

  const user = await User.findById(userId).select("skills isActive");
  if (!user || user.isActive === false) {
    throw new Error("User not found");
  }

  const userSkills = Array.isArray(user.skills) ? user.skills : [];

  const [joinedRows, appliedRows] = await Promise.all([
    Team.find({ userId, status: "active", isDeleted: false }).select("projectId").lean(),
    Application.find({ applicantId: userId, isDeleted: false, status: { $in: ['pending', 'accepted'] } }).select("projectId").lean(),
  ]);

  const joinedProjectIds = joinedRows.map((r) => r.projectId).filter(Boolean);
  const appliedProjectIds = appliedRows.map((r) => r.projectId).filter(Boolean);

  const excludeIds = [...new Set([...joinedProjectIds, ...appliedProjectIds].map(String))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const uid = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    {
      $match: {
        isDeleted: false,
        visibility: "public",
        status: "recruiting",
        owner: { $ne: uid },
        ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
      },
    },
    {
      // Guard against inconsistent data: don't recommend if already full
      $match: {
        $expr: { $lt: ["$currentTeamSize", "$teamSizeRequired"] },
      },
    },
    {
      $addFields: {
        commonSkills: { $setIntersection: ["$requiredSkills", userSkills] },
      },
    },
    {
      $addFields: {
        commonCount: { $size: "$commonSkills" },
        projectSkillCount: { $size: "$requiredSkills" }
      },
    },
    {
      $addFields: {
        minSkillCount: { $min: [userSkills.length, "$projectSkillCount"] }
      }
    },
    {
      $addFields: {
        matchScore: {
          $cond: [
            { $eq: ["$minSkillCount", 0] },
            0,
            { $multiply: [{ $divide: ["$commonCount", "$minSkillCount"] }, 100] },
          ],
        },
      },
    },
    { $sort: { matchScore: -1, createdAt: -1 } },
    { $limit: lim },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDoc",
      },
    },
    { $unwind: { path: "$ownerDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "skills",
        localField: "requiredSkills",
        foreignField: "_id",
        as: "requiredSkillsDocs",
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        projectType: 1,
        status: 1,
        visibility: 1,
        currentTeamSize: 1,
        teamSizeRequired: 1,
        openRoles: 1,
        createdAt: 1,
        matchScore: { $round: ["$matchScore", 2] },
        commonCount: 1,
        projectSkillCount: 1,
        minSkillCount: 1,
        owner: {
          _id: "$ownerDoc._id",
          name: "$ownerDoc.name",
          bio: "$ownerDoc.bio",
        },
        requiredSkills: {
          $map: {
            input: "$requiredSkillsDocs",
            as: "s",
            in: { _id: "$$s._id", name: "$$s.name" },
          },
        },
      },
    },
  ];

  return await Project.aggregate(pipeline).exec();
};
