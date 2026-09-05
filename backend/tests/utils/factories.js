import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';
import Team from '../../src/models/team.model.js';
import Task from '../../src/models/task.model.js';
import Application from '../../src/models/application.model.js';

/**
 * Helper to generate random string
 */
export const randomString = () => Math.random().toString(36).substring(7);

/**
 * Creates and saves a User document.
 */
export const createUser = async (overrides = {}) => {
  const user = new User({
    name: `Test User ${randomString()}`,
    email: `testuser_${randomString()}@example.com`,
    password: 'password123',
    stats: { tasksCompleted: 0, projectsCompleted: 0, projectsActive: 0, applicationsSent: 0, applicationsAccepted: 0, acceptanceRate: 0 },
    ...overrides
  });
  return await user.save();
};

/**
 * Creates and saves a Project document.
 */
export const createProject = async (ownerId, overrides = {}) => {
  const project = new Project({
    title: `Test Project ${randomString()}`,
    description: 'A project for automated testing.',
    owner: ownerId,
    visibility: 'public',
    status: 'recruiting',
    projectType: 'web',
    teamSizeRequired: 5,
    metrics: { completedTasks: 0, totalTasks: 0 },
    ...overrides
  });
  return await project.save();
};

/**
 * Creates and saves a Team (Membership) document.
 */
export const createTeamMember = async (projectId, userId, role = 'member', overrides = {}) => {
  const team = new Team({
    projectId,
    userId,
    role,
    status: 'active',
    ...overrides
  });
  return await team.save();
};

/**
 * Creates and saves a Task document.
 */
export const createTask = async (projectId, createdBy, overrides = {}) => {
  const task = new Task({
    projectId,
    title: `Test Task ${randomString()}`,
    description: 'A task for automated testing.',
    status: 'todo',
    priority: 'medium',
    createdBy,
    ...overrides
  });
  return await task.save();
};

/**
 * Creates and saves an Application document.
 */
export const createApplication = async (projectId, applicantId, overrides = {}) => {
  const app = new Application({
    projectId,
    applicantId,
    role: 'Developer',
    status: 'pending',
    ...overrides
  });
  return await app.save();
};
