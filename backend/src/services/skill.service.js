import Skill from "../models/skill.model.js";

export const getAllSkills = async () => {
  return await Skill.find().sort({ popularityCount: -1 });
};

export const searchSkills = async (query) => {
  if (!query) return [];

  return await Skill.find({
    name: { $regex: query, $options: "i" }
  }).limit(10);
};