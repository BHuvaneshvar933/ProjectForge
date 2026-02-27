import Application from "../models/application.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";

export const applyToProject = async (userId, data) => {
  const { projectId, message = "" } = data;

  // Validate User
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error("Account is inactive");
  }

  // Validate Project
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.isDeleted) {
    throw new Error("Project is no longer available");
  }

  if (project.status !== "recruiting") {
    throw new Error("Project is not accepting applications");
  }

  if (project.currentTeamSize >= project.teamSizeRequired) {
    throw new Error("Project team is already full");
  }

  //Cannot apply to own project
  if (project.owner.toString() === userId.toString()) {
    throw new Error("Cannot apply to your own project");
  }

  // Check active team membership
  const existingMember = await Team.findOne({
    projectId,
    userId,
    status: "active"
  });

  if (existingMember) {
    throw new Error("You are already a member of this team");
  }

  // Check existing application
  const existingApplication = await Application.findOne({
    projectId,
    applicantId: userId
  });

  if (existingApplication) {
    throw new Error("You have already applied to this project");
  }

  // Match Score
  let matchScore = 0;

  if (user.skills && project.requiredSkills) {
    const userSkillIds = user.skills.map(s => s.toString());
    const projectSkillIds = project.requiredSkills.map(s => s.toString());

    const intersection = userSkillIds.filter(id =>
      projectSkillIds.includes(id)
    );

    const union = [...new Set([...userSkillIds, ...projectSkillIds])];

    matchScore = union.length > 0
      ? Math.round((intersection.length / union.length) * 100)
      : 0;
  }

  // Create Application
  const application = await Application.create({
    projectId,
    applicantId: userId,
    message,
    matchScore,
    status: "pending"
  });

  // Update user stats
  user.stats.applicationsSent += 1;
  await user.save();

  return application;
};