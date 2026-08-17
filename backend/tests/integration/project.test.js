import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';

describe('Project API Integration Tests', () => {
  let mongoServer;
  let authToken;
  let userId;

  beforeAll(async () => {
    // Start isolated MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    // Create a test user and get auth token for protected routes
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Project Tester',
        email: 'tester@example.com',
        password: 'Password123!'
      });
      
    authToken = userRes.body.data.token;
    userId = userRes.body.data.user._id;
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully (201)', async () => {
      const projectPayload = {
        title: 'Test Project',
        description: 'A project for testing',
        teamSizeRequired: 5,
        projectType: 'web',
        requiredSkills: [new mongoose.Types.ObjectId().toString()]
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectPayload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.project).toHaveProperty('_id');
      expect(res.body.data.project.title).toBe('Test Project');
      expect(res.body.data.project.owner.toString()).toBe(userId.toString());
    });

    it('should fail with 401 if authentication token is missing', async () => {
      const projectPayload = {
        title: 'Unauthorized Project',
        description: 'Should fail',
        teamSizeRequired: 2,
        projectType: 'web',
        requiredSkills: [new mongoose.Types.ObjectId().toString()]
      };

      const res = await request(app)
        .post('/api/projects')
        .send(projectPayload)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Not authorized/i);
    });

    it('should fail with 400 if required fields are missing', async () => {
      // Missing 'description', 'teamSizeRequired', and 'projectType'
      const invalidPayload = {
        title: 'Incomplete Project'
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 404 or 500 for a project that does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/projects/${fakeId}`);

      expect(res.body.success).toBe(false);
    });

    it('should fail with 500/400 for an invalid ObjectId format', async () => {
      const res = await request(app)
        .get(`/api/projects/invalid-id-format`);
      
      expect(res.body.success).toBe(false);
    });

    it('should successfully retrieve an existing project', async () => {
      // First create a project
      const projectPayload = {
        title: 'Get Me Project',
        description: 'Retrieve this',
        teamSizeRequired: 3,
        projectType: 'ml',
        requiredSkills: [new mongoose.Types.ObjectId().toString()]
      };

      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectPayload);
        
      const projectId = createRes.body.data.project._id;

      // Now fetch it
      const fetchRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(fetchRes.body.success).toBe(true);
      expect(fetchRes.body.data.project.title).toBe('Get Me Project');
    });
  });
});
