import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnv } from '../setup/testEnv.js';
import { createUser, createProject, createTeamMember, createTask } from '../utils/factories.js';
import { assignTask, updateTaskStatus } from '../../src/services/task.service.js';
import { runConcurrent, analyzeConcurrencyResults } from '../utils/concurrency.js';
import Task from '../../src/models/task.model.js';
import User from '../../src/models/user.model.js';

setupTestEnv();

describe('Task Concurrency & Race Conditions', () => {
  let project, owner;

  beforeEach(async () => {
    owner = await createUser();
    project = await createProject(owner._id);
    await createTeamMember(project._id, owner._id);
  });

  it('Competing Users: Only one user can claim a task concurrently', async () => {
    const task = await createTask(project._id, owner._id);
    const users = [];

    // Create 5 concurrent users
    for (let i = 0; i < 5; i++) {
      const u = await createUser();
      await createTeamMember(project._id, u._id);
      users.push(u);
    }

    // Act: All 5 attempt to claim the exact same task simultaneously
    const results = await runConcurrent(5, async (i) => {
      // Re-fetch task to get latest __v, but simulate concurrent requests having the same original __v
      const payload = { assignedTo: users[i]._id, __v: task.__v };
      return await assignTask(task._id, payload, users[i]);
    });

    const analysis = analyzeConcurrencyResults(results);

    // Assert: Exactly ONE should succeed, the rest should fail due to VersionError (Optimistic Concurrency)
    expect(analysis.successes).toBe(1);
    expect(analysis.failures).toBe(4);

    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.assignedTo).not.toBeNull();
  });

  it('Double Submit (Idempotency): Completing a task concurrently should not duplicate side-effects', async () => {
    const task = await createTask(project._id, owner._id, { assignedTo: owner._id, status: 'in-progress' });

    // Act: Same user clicks "Complete" 5 times simultaneously
    const results = await runConcurrent(5, async () => {
      // Simulate client passing the original __v
      return await updateTaskStatus(task._id, 'done', owner._id, task.__v);
    });

    const analysis = analyzeConcurrencyResults(results);

    // Only the first one to hit the database with the correct version key should succeed
    expect(analysis.successes).toBe(1);
    expect(analysis.failures).toBe(4);

    const updatedUser = await User.findById(owner._id);
    // Stat should increment exactly once!
    expect(updatedUser.stats.tasksCompleted).toBe(1);
  });
});
