import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTestEnv } from '../setup/testEnv.js';
import { createUser, createProject, createTeamMember, createTask } from '../utils/factories.js';
import { updateTaskStatus } from '../../src/services/task.service.js';
import Task from '../../src/models/task.model.js';
import Project from '../../src/models/project.model.js';
import User from '../../src/models/user.model.js';
import * as db from '../setup/db.js';

setupTestEnv();

describe('Task Transactions', () => {
  let user, project, task;

  beforeEach(async () => {
    user = await createUser();
    project = await createProject(user._id);
    await createTeamMember(project._id, user._id);
    task = await createTask(project._id, user._id, { assignedTo: user._id });
  });

  it('commits successfully when marking task as done', async () => {
    // Act
    await updateTaskStatus(task._id, 'done', user._id, task.__v);

    // Assert
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.status).toBe('done');
    expect(updatedTask.completedAt).not.toBeNull();

    const updatedProject = await Project.findById(project._id);
    expect(updatedProject.archiveData.timelineEvents).toHaveLength(1);
    expect(updatedProject.metrics.completedTasks).toBe(1);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.stats.tasksCompleted).toBe(1);
  });

  it('rolls back completely if a failure occurs mid-transaction', async () => {
    // Mock Project.prototype.save to intentionally throw an error mid-transaction
    const originalSave = Project.prototype.save;
    Project.prototype.save = vi.fn().mockRejectedValueOnce(new Error('Simulated Database Error'));

    // Act
    await expect(updateTaskStatus(task._id, 'done', user._id, task.__v))
      .rejects.toThrow('Simulated Database Error');

    // Restore save
    Project.prototype.save = originalSave;

    // Assert: Everything must be rolled back!
    const unchangedTask = await Task.findById(task._id);
    expect(unchangedTask.status).toBe('todo'); // Should NOT be 'done'
    expect(unchangedTask.completedAt).toBeNull(); // Should NOT have a completed date

    const unchangedUser = await User.findById(user._id);
    expect(unchangedUser.stats.tasksCompleted).toBe(0); // Should NOT have incremented stats
  });
});
