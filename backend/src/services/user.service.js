import User from "../models/user.model.js";
import "../models/skill.model.js";

export const getMyProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate("skills", "name category")
    .select("-password");

  if (!user || user.isActive === false) {
    throw new Error("User not found");
  }

  return user;
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

  return user;
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
