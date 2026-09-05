import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestEnv } from '../setup/testEnv.js';
import { createUser, createProject, createTeamMember } from '../utils/factories.js';
import { createMessage, getProjectMessages } from '../../src/services/message.service.js';
import { runConcurrent, analyzeConcurrencyResults } from '../utils/concurrency.js';
import Message from '../../src/models/message.model.js';

setupTestEnv();

describe('Chat Reliability & Authorization', () => {
  let project, owner;

  beforeEach(async () => {
    owner = await createUser();
    project = await createProject(owner._id);
    await createTeamMember(project._id, owner._id);
  });

  it('Basic Persistence & Ordering: Messages are saved and retrieved in chronological order', async () => {
    // Act: Send 10 messages sequentially
    for (let i = 1; i <= 10; i++) {
      await createMessage({ projectId: project._id, userId: owner._id, content: `Message ${i}` });
    }

    // Retrieve messages (should be newest first internally, then reversed to oldest first for UI)
    const result = await getProjectMessages({ projectId: project._id, userId: owner._id, page: 1, limit: 10 });
    const msgs = result.messages;

    expect(msgs).toHaveLength(10);
    // Because they are reversed back for the UI, msgs[0] should be "Message 1"
    expect(msgs[0].content).toBe('Message 1');
    expect(msgs[9].content).toBe('Message 10');
  });

  it('Authorization: Non-members cannot send or retrieve messages', async () => {
    const nonMember = await createUser();

    await expect(createMessage({ projectId: project._id, userId: nonMember._id, content: 'Sneaky' }))
      .rejects.toThrow('Access denied');

    await expect(getProjectMessages({ projectId: project._id, userId: nonMember._id }))
      .rejects.toThrow('Access denied');
  });

  it('High Concurrency: 20 users sending 50 messages each (1000 total)', async () => {
    const USERS = 20;
    const MSG_PER_USER = 50;
    const TOTAL = USERS * MSG_PER_USER;

    // Create 20 members
    const members = [];
    for (let i = 0; i < USERS; i++) {
      const u = await createUser();
      await createTeamMember(project._id, u._id);
      members.push(u);
    }

    // Build the tasks array
    const tasks = [];
    for (let u = 0; u < USERS; u++) {
      for (let m = 0; m < MSG_PER_USER; m++) {
        tasks.push({ user: members[u], content: `User ${u} Msg ${m}` });
      }
    }

    // Shuffle tasks to maximize real-world entropy
    tasks.sort(() => Math.random() - 0.5);

    // Act: Fire all 1000 messages simultaneously
    const results = await runConcurrent(TOTAL, async (i) => {
      const task = tasks[i];
      return await createMessage({ projectId: project._id, userId: task.user._id, content: task.content });
    });

    const analysis = analyzeConcurrencyResults(results);

    // Assert: All 1000 succeeded
    expect(analysis.failures).toBe(0);
    expect(analysis.successes).toBe(TOTAL);

    // Assert DB actually has 1000 messages
    const dbCount = await Message.countDocuments({ projectId: project._id });
    expect(dbCount).toBe(TOTAL);
  }, 15000); // Give it up to 15s for the heavy concurrent load

});
