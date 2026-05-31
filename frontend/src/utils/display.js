export const isMongoObjectIdLike = (value) => {
  if (typeof value !== "string") return false;
  // Common MongoDB ObjectId shape (24 hex chars). Avoid rendering these to users.
  return /^[a-f\d]{24}$/i.test(value.trim());
};

export const displaySkillLabel = (skill) => {
  if (!skill) return "Skill";
  if (typeof skill === "string") return isMongoObjectIdLike(skill) ? "Skill" : skill;
  const name = typeof skill?.name === "string" ? skill.name : "";
  if (name) return name;
  // If we somehow got a populated doc without a name, avoid leaking an _id.
  const maybeId = typeof skill?._id === "string" ? skill._id : "";
  return isMongoObjectIdLike(maybeId) ? "Skill" : (maybeId || "Skill");
};
