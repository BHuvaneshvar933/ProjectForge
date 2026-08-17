import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';
import Project from '../../src/models/project.model.js';

describe('project api stuff', () => {
  let mongoServer;
  let authToken;
  let userId;

  beforeAll(async () => {
    // start db
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
    // drop db before each
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    // get user and token
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'test guy',
        email: 'test@example.com',
        password: 'Password123!'
      });
      
    authToken = userRes.body.data.token;
    userId = userRes.body.data.user._id;
  });

  describe('POST /api/projects', () => {
    it('makes project ok', async () => {
      const projectPayload = {
        title: 'Test Project',
        description: 'testing',
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

    it('fails if no token', async () => {
      const projectPayload = {
        title: 'fail project',
        description: 'fail',
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

    it('fails if missing fields', async () => {
      // bad payload
      const invalidPayload = {
        title: 'Incomplete'
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('fails if not there', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/projects/${fakeId}`);

      expect(res.body.success).toBe(false);
    });

    it('fails if garbage id format', async () => {
      const res = await request(app)
        .get(`/api/projects/garbage-id`);
      
      expect(res.body.success).toBe(false);
    });

    it('gets existing project', async () => {
      // make one first
      const projectPayload = {
        title: 'Get Me Project',
        description: 'get this',
        teamSizeRequired: 3,
        projectType: 'ml',
        requiredSkills: [new mongoose.Types.ObjectId().toString()]
      };

      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectPayload);
        
      const projectId = createRes.body.data.project._id;

      // get it
      const fetchRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(fetchRes.body.success).toBe(true);
      expect(fetchRes.body.data.project.title).toBe('Get Me Project');
    });
  });
});

