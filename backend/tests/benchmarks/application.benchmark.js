import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { monitorEventLoopDelay } from 'perf_hooks';
import readline from 'readline';
import { applyToProject } from '../../src/services/applications.mutation.service.js';
import Application from '../../src/models/application.model.js';
import { createUser, createProject } from '../utils/factories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split("=");
  acc[key.replace("--", "")] = value || true;
  return acc;
}, {});

const RAMP = args.ramp ? args.ramp.split(',').map(Number) : [10, 50, 100, 500, 1000];
const APPS_PER_USER = parseInt(args['apps-per-user'], 10) || 10;
const SKIP_PROMPT = args.yes || false;

process.env.BENCHMARK_MODE = "true"; // Tell the service to attach _benchmarkTimings

const calculatePercentile = (latencies, p) => {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index].toFixed(2);
};

const runCoordinatedConcurrentDispatch = async (tasks, operationFn) => {
  const promises = [];
  const latencies = [];
  const results = [];
  const timingsList = [];
  
  let releaseBarrier;
  const barrier = new Promise((resolve) => {
    releaseBarrier = resolve;
  });

  for (let i = 0; i < tasks.length; i++) {
    const worker = (async () => {
      await barrier;
      const start = performance.now();
      try {
        const res = await operationFn(tasks[i]);
        const elapsed = performance.now() - start;
        latencies.push(elapsed);
        results.push({ success: true });
        if (res?._benchmarkTimings) {
          timingsList.push(res._benchmarkTimings);
        }
      } catch (err) {
        const elapsed = performance.now() - start;
        latencies.push(elapsed);
        results.push({ success: false, error: err.message });
      }
    })();
    promises.push(worker);
  }

  const startTotal = performance.now();
  releaseBarrier();
  await Promise.all(promises);
  const totalElapsed = performance.now() - startTotal;

  return { results, latencies, totalElapsed, timingsList };
};

const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

const benchmarkStressRamp = async () => {
  console.log(`\n==================================================`);
  console.log(`PROJECTFORGE APPLICATION STRESS BENCHMARK`);
  console.log(`==================================================`);
  console.log(`Ramp:           ${RAMP.join(', ')}`);
  console.log(`Apps/User:      ${APPS_PER_USER}`);
  console.log(`Node:           ${process.version}`);
  console.log(`==================================================\n`);

  if (!SKIP_PROMPT) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(r => rl.question(`Continue? [y/N]: `, r));
    rl.close();
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') process.exit(0);
  }

  // Pre-create the projects needed for APPS_PER_USER
  console.log(`Pre-creating ${APPS_PER_USER} projects for the benchmark...`);
  const projects = [];
  const owner = await createUser();
  for (let i = 0; i < APPS_PER_USER; i++) {
    projects.push(await createProject(owner._id, { teamSizeRequired: 100000 }));
  }

  for (const numUsers of RAMP) {
    console.log(`\n--- STRESS STAGE: ${numUsers} USERS ---`);
    
    await Application.deleteMany({}); // Clean up old applications
    
    console.log(`Creating ${numUsers} users...`);
    const users = [];
    for (let i = 0; i < numUsers; i++) {
      users.push(await createUser());
    }
    
    const h = monitorEventLoopDelay({ resolution: 20 });
    h.enable();
    const memStart = process.memoryUsage();
    
    const expectedOperations = numUsers * APPS_PER_USER;
    const tasks = [];
    for (let u = 0; u < numUsers; u++) {
      for (let p = 0; p < APPS_PER_USER; p++) {
        tasks.push({ userId: users[u]._id, projectId: projects[p]._id });
      }
    }
    tasks.sort(() => Math.random() - 0.5); // Shuffle

    const { results, latencies, totalElapsed, timingsList } = await runCoordinatedConcurrentDispatch(tasks, async (task) => {
      return await applyToProject(task.userId, { projectId: task.projectId, message: 'Benchmark application' });
    });

    h.disable();
    const memEnd = process.memoryUsage();
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    const msgPerSec = ((successCount / totalElapsed) * 1000);
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    
    const persistedCount = await Application.countDocuments();
    const missing = expectedOperations - persistedCount - failCount;

    // Aggregate timings
    let avgValAuth = 0, avgLookup = 0, avgInsert = 0, avgStatsNotify = 0;
    if (timingsList.length > 0) {
      avgValAuth = timingsList.reduce((acc, t) => acc + t.valAuth, 0) / timingsList.length;
      avgLookup = timingsList.reduce((acc, t) => acc + t.lookup, 0) / timingsList.length;
      avgInsert = timingsList.reduce((acc, t) => acc + t.insert, 0) / timingsList.length;
      avgStatsNotify = timingsList.reduce((acc, t) => acc + t.statsNotify, 0) / timingsList.length;
    }
    
    console.log(`Workload:   ${numUsers} users, ${expectedOperations} total operations`);
    console.log(`Throughput: ${msgPerSec.toFixed(0)} app/s`);
    console.log(`Correct:    ${successCount} successful, ${failCount} failed, ${missing} missing`);
    console.log(`Latency:    p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
    console.log(`Breakdown (avg per req): Val/Auth=${avgValAuth.toFixed(1)}ms | Lookup=${avgLookup.toFixed(1)}ms | Insert=${avgInsert.toFixed(1)}ms | Stats+Notify=${avgStatsNotify.toFixed(1)}ms`);
    console.log(`Event Loop: p99 lag ${((h.percentile(99) || 0) / 1e6).toFixed(2)}ms`);
    console.log(`Memory:     RSS: ${formatBytes(memEnd.rss)} | Heap: ${formatBytes(memEnd.heapUsed)}`);
  }
};

const runBenchmarks = async () => {
  let mongoServer;
  try {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());
    
    const models = mongoose.connection.models;
    for (const key in models) {
      await models[key].createCollection();
    }

    await benchmarkStressRamp();

  } catch (error) {
    console.error("Benchmark failed with error:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) await mongoServer.stop();
    console.log("\nBenchmarks Completed.");
    process.exit(0);
  }
};

runBenchmarks();
