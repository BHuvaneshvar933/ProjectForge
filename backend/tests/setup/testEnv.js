import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, closeDB, clearDB } from './db.js';

/**
 * Standard test environment setup for Vitest.
 * Call this inside a `describe` block in any test file.
 */
export const setupTestEnv = () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    const models = mongoose.connection.models;
    for (const key in models) {
      await models[key].createCollection();
    }
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });
};
