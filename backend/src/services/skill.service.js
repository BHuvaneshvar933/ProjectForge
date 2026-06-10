import Skill from "../models/skill.model.js";

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllSkills = async () => {
  return await Skill.find().sort({ popularityCount: -1 });
};

export const searchSkills = async (query) => {
  if (!query) return [];

  const q = String(query).trim();
  if (!q) return [];

  const rx = `^${escapeRegExp(q)}`;

  return await Skill.find({
    $or: [
      { name: { $regex: rx, $options: "i" } },
      { aliases: { $elemMatch: { $regex: rx, $options: "i" } } },
    ],
  })
    .sort({ popularityCount: -1, name: 1 })
    .limit(10);
};
