import User from "../models/user.model.js";
import "../models/skill.model.js";

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

  return user;
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