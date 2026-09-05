import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnv } from '../setup/testEnv.js';
import { createUser, createProject } from '../utils/factories.js';
import { applyToProject } from '../../src/services/applications.mutation.service.js';
import { runConcurrent, analyzeConcurrencyResults } from '../utils/concurrency.js';
import Application from '../../src/models/application.model.js';
import User from '../../src/models/user.model.js';

setupTestEnv();

describe('Application Concurrency & Race Conditions', () => {
  let project, owner, user;

  beforeEach(async () => {
    owner = await createUser();
    project = await createProject(owner._id, { teamSizeRequired: 5 });
    user = await createUser();
  });

  it('Test A: Same user, same project - Duplicate submissions must be rejected safely', async () => {
    // Act: Send 100 simultaneous applications from the SAME user to the SAME project
    const results = await runConcurrent(100, async () => {
      return await applyToProject(user._id, { projectId: project._id, message: 'I want to join' });
    });

    const analysis = analyzeConcurrencyResults(results);

    // Expected: Exactly ONE should succeed, the rest should fail safely
    expect(analysis.successes).toBe(1);
    expect(analysis.failures).toBe(99);

    // Validate database state
    const apps = await Application.find({ projectId: project._id, applicantId: user._id });
    expect(apps.length).toBe(1); // Only 1 application record should exist
    
    // Check that user stats were not updated multiple times (lost updates or duplications)
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.stats.applicationsSent).toBe(1);
  });

  it('Test B: Different users, same project - Every valid user\'s application should be processed correctly', async () => {
    const users = [];
    for (let i = 0; i < 50; i++) {
      users.push(await createUser());
    }

    // Act: Send 50 concurrent applications from 50 DIFFERENT users to the same project
    const results = await runConcurrent(50, async (i) => {
      return await applyToProject(users[i]._id, { projectId: project._id, message: 'I want to join' });
    });

    const analysis = analyzeConcurrencyResults(results);

    // Expected: All 50 should succeed
    expect(analysis.successes).toBe(50);
    expect(analysis.failures).toBe(0);

    // Validate database state
    const apps = await Application.find({ projectId: project._id });
    expect(apps.length).toBe(50);

    // Ensure all 50 unique users have their stats updated
    const uniqueApplicants = new Set(apps.map(app => app.applicantId.toString()));
    expect(uniqueApplicants.size).toBe(50);
  });
});
