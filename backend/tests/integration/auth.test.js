import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';

describe('auth stuff', () => {
  let mongoServer;

  beforeAll(async () => {
    // start db
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // connect db
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // stop db
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // clear db
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  });

  describe('POST /api/auth/register', () => {
    it('registers user ok', async () => {
      const payload = {
        name: 'test',
        email: 'test@test.com',
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        name: 'test',
        email: 'test@test.com',
      });

      // check db just in case
      const userInDb = await User.findOne({ email: 'test@test.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.name).toBe('test');
    });

    it('yells if duplicate email', async () => {
      const payload = {
        name: 'dup',
        email: 'dup@test.com',
        password: 'Password123!',
      };

      // do it once
      await request(app).post('/api/auth/register').send(payload);

      // do it again
      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        // api throws 500 cause lazy error handling
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Email already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in ok', async () => {
      const registerPayload = {
        name: 'login guy',
        email: 'login@test.com',
        password: 'SecretPassword123!',
      };

      // reg
      await request(app).post('/api/auth/register').send(registerPayload);

      // login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'SecretPassword123!'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('fails if bad password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nope@test.com',
          password: 'WrongPassword'
        })
        // 500 cause bad err handling
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });
  });

  describe('GET /api/users/me', () => {
    it('gets profile if token good', async () => {
      // 1. reg
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'safe guy',
          email: 'safe@test.com',
          password: 'Password123!'
        });
      
      const token = registerRes.body.data.token;

      // 2. get stuff
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('safe@test.com');
    });

    it('bounces if no token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Not authorized/i);
    });
  });
});
