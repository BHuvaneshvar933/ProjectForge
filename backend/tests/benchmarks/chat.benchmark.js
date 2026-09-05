import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { monitorEventLoopDelay } from 'perf_hooks';
import readline from 'readline';
import { createMessage, getProjectMessages } from '../../src/services/message.service.js';
import Message from '../../src/models/message.model.js';
import { createUser, createProject, createTeamMember } from '../utils/factories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split("=");
  acc[key.replace("--", "")] = value || true;
  return acc;
}, {});

const MODE = args.mode || 'controlled'; 
const RAMP = args.ramp ? args.ramp.split(',').map(Number) : [10, 25, 50, 100, 200, 500, 1000, 2000, 5000];
const MSG_PER_USER = parseInt(args['messages-per-user'], 10) || 20;
const DURATION_SEC = parseInt(args.duration, 10) || 60;
const MAX_USERS = parseInt(args['max-users'], 10) || 5000;
const SKIP_PROMPT = args.yes || false;
const CHAT_MESSAGES_PER_USER = parseInt(process.env.CHAT_MESSAGES_PER_USER) || 50;
const IGNORE_SATURATION = args['ignore-saturation'] || false;
const MAX_P95 = parseInt(args['max-p95'], 10) || 10000;


const PER_USER_MESSAGES = CHAT_MESSAGES_PER_USER;

/** Math Helpers for latency percentiles */
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
        results.push({ success: true, value: res });
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

  return { results, latencies, totalElapsed };
};

const benchmarkBurstWrite = async (project, userLevels) => {
  console.log(`\n\n--- BURST WRITE CAPACITY BENCHMARK ---`);
  console.log(`Users | Messages | Success | Failed | Msg/s | p50 (ms) | p95 (ms) | p99 (ms)`);
  console.log(`-----------------------------------------------------------------------------`);

  for (const numUsers of userLevels) {
    const totalMessages = numUsers * PER_USER_MESSAGES;
    const tasks = [];
    
    // Create users dynamically
    const members = [];
    for (let i = 0; i < numUsers; i++) {
      const u = await createUser();
      await createTeamMember(project._id, u._id);
      members.push(u);
    }

    for (let u = 0; u < numUsers; u++) {
      for (let m = 0; m < PER_USER_MESSAGES; m++) {
        tasks.push({ user: members[u], content: `Burst Message ${m} from User ${u}` });
      }
    }
    
    tasks.sort(() => Math.random() - 0.5); // Shuffle

    const { results, latencies, totalElapsed } = await runCoordinatedConcurrentDispatch(tasks, async (task) => {
      return await createMessage({ projectId: project._id, userId: task.user._id, content: task.content });
    });

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    const msgPerSec = ((successCount / totalElapsed) * 1000).toFixed(0);
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    
    console.log(`${numUsers.toString().padEnd(5)} | ${totalMessages.toString().padEnd(8)} | ${successCount.toString().padEnd(7)} | ${failCount.toString().padEnd(6)} | ${msgPerSec.toString().padEnd(5)} | ${p50.toString().padEnd(8)} | ${p95.toString().padEnd(8)} | ${p99}`);
  }
};

const benchmarkSustainedWrite = async (project, numUsers, durationSeconds) => {
  console.log(`\n\n--- SUSTAINED WRITE THROUGHPUT (${durationSeconds} SECONDS) ---`);
  
  const members = [];
  for (let i = 0; i < numUsers; i++) {
    const u = await createUser();
    await createTeamMember(project._id, u._id);
    members.push(u);
  }

  let isRunning = true;
  let totalSuccess = 0;
  let totalFailed = 0;
  const latencies = [];
  
  const workerLoop = async (user) => {
    while (isRunning) {
      const start = performance.now();
      try {
        await createMessage({ projectId: project._id, userId: user._id, content: `Sustained load` });
        latencies.push(performance.now() - start);
        totalSuccess++;
      } catch (err) {
        latencies.push(performance.now() - start);
        totalFailed++;
      }
    }
  };

  const startTotal = performance.now();
  
  // Start all workers
  const promises = members.map(user => workerLoop(user));
  
  // Wait for duration
  await new Promise(r => setTimeout(r, durationSeconds * 1000));
  isRunning = false;
  
  // Wait for workers to cleanly finish their current iteration
  await Promise.all(promises);
  
  const elapsed = performance.now() - startTotal;
  const msgPerSec = ((totalSuccess / elapsed) * 1000).toFixed(0);
  
  console.log(`Active Users: ${numUsers}`);
  console.log(`Total Success: ${totalSuccess}, Total Failed: ${totalFailed}`);
  console.log(`Sustained Throughput: ${msgPerSec} Msg/s`);
  console.log(`p50: ${calculatePercentile(latencies, 50)}ms | p95: ${calculatePercentile(latencies, 95)}ms | p99: ${calculatePercentile(latencies, 99)}ms`);
};

const benchmarkControlledWorkload = async (project, userLevels, messageLevels) => {
  console.log(`\n\n--- CONTROLLED WORKLOAD MATRIX ---`);
  console.log(`Users | Msgs/User | Total | Success | Failed | Msg/s | p50 (ms) | p95 (ms) | p99 (ms)`);
  console.log(`--------------------------------------------------------------------------------------`);

  for (const numUsers of userLevels) {
    // Create users dynamically
    const members = [];
    for (let i = 0; i < numUsers; i++) {
      const u = await createUser();
      await createTeamMember(project._id, u._id);
      members.push(u);
    }

    for (const msgCount of messageLevels) {
      const totalMessages = numUsers * msgCount;
      const tasks = [];
      
      for (let u = 0; u < numUsers; u++) {
        for (let m = 0; m < msgCount; m++) {
          tasks.push({ user: members[u], content: `Matrix Msg ${m} from User ${u}` });
        }
      }
      
      tasks.sort(() => Math.random() - 0.5); // Shuffle

      const { results, latencies, totalElapsed } = await runCoordinatedConcurrentDispatch(tasks, async (task) => {
        return await createMessage({ projectId: project._id, userId: task.user._id, content: task.content });
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      const msgPerSec = ((successCount / totalElapsed) * 1000).toFixed(0);
      const p50 = calculatePercentile(latencies, 50);
      const p95 = calculatePercentile(latencies, 95);
      const p99 = calculatePercentile(latencies, 99);
      
      console.log(`${numUsers.toString().padEnd(5)} | ${msgCount.toString().padEnd(9)} | ${totalMessages.toString().padEnd(5)} | ${successCount.toString().padEnd(7)} | ${failCount.toString().padEnd(6)} | ${msgPerSec.toString().padEnd(5)} | ${p50.toString().padEnd(8)} | ${p95.toString().padEnd(8)} | ${p99}`);
    }
  }
};

const benchmarkConcurrentReads = async (project, readerLevels) => {
  console.log(`\n\n--- READ CAPACITY BENCHMARK ---`);
  console.log(`Readers | Success | Failed | p50 (ms) | p95 (ms) | p99 (ms)`);
  console.log(`-------------------------------------------------------------`);

  // We assume the DB is already populated with thousands of messages from the previous tests
  
  for (const numReaders of readerLevels) {
    const readers = [];
    for (let i = 0; i < numReaders; i++) {
      const u = await createUser();
      await createTeamMember(project._id, u._id);
      readers.push({ user: u });
    }

    const { results, latencies } = await runCoordinatedConcurrentDispatch(readers, async (task) => {
      // Read page 1 (50 msgs)
      return await getProjectMessages({ projectId: project._id, userId: task.user._id, page: 1, limit: 50 });
    });

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    
    console.log(`${numReaders.toString().padEnd(7)} | ${successCount.toString().padEnd(7)} | ${failCount.toString().padEnd(6)} | ${p50.toString().padEnd(8)} | ${p95.toString().padEnd(8)} | ${p99}`);
  }
};

const promptUser = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
};

const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

const benchmarkStressRamp = async (project) => {
  console.log(`\n==================================================`);
  console.log(`PROJECTFORGE CHAT STRESS BENCHMARK`);
  console.log(`==================================================`);
  console.log(`Mode:           ${MODE}`);
  console.log(`Max Users:      ${MAX_USERS}`);
  console.log(`Ramp:           ${RAMP.join(', ')}`);
  console.log(`Messages/User:  ${MSG_PER_USER}`);
  if (MODE === 'stress-sustained') console.log(`Duration/stage: ${DURATION_SEC}s`);
  console.log(`Node:           ${process.version}`);
  console.log(`CPU:            ${os.cpus()[0].model} (${os.cpus().length} cores)`);
  console.log(`==================================================\n`);

  if (!SKIP_PROMPT) {
    const answer = await promptUser(`WARNING: This is a stress benchmark and can consume significant CPU/RAM. Continue? [y/N]: `);
    if (answer !== 'y' && answer !== 'yes') {
      console.log('Aborting.');
      process.exit(0);
    }
  }

  const resultsJSON = {
    environment: {
      node: process.version,
      os: os.type(),
      cpu: os.cpus()[0].model,
      cores: os.cpus().length,
      ram: formatBytes(os.totalmem() * 1024 * 1024)
    },
    configuration: { mode: MODE, msgPerUser: MSG_PER_USER, ramp: RAMP },
    stages: [],
    summary: { highestSuccessfulStage: null, peakObservedThroughput: 0, saturationStage: null, failureStage: null }
  };

  const resultsDir = path.join(__dirname, 'benchmark-results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);
  const jsonPath = path.join(resultsDir, `chat-stress-${Date.now()}.json`);

  const saveResults = () => {
    fs.writeFileSync(jsonPath, JSON.stringify(resultsJSON, null, 2));
  };
  
  process.on('SIGINT', () => {
    console.log("\nInterrupted! Saving JSON results...");
    saveResults();
    process.exit(1);
  });

  let previousThroughput = 0;
  let previousP95 = 0;
  
  for (const numUsers of RAMP) {
    if (numUsers > MAX_USERS) break;
    console.log(`\n--- STRESS STAGE: ${numUsers} USERS ---`);
    
    // Drop existing messages to prevent growing db size from skewing concurrency test
    await Message.deleteMany({ projectId: project._id });
    
    const members = [];
    for (let i = 0; i < numUsers; i++) {
      const u = await createUser();
      await createTeamMember(project._id, u._id);
      members.push(u);
    }
    
    const h = monitorEventLoopDelay({ resolution: 20 });
    h.enable();
    const memStart = process.memoryUsage();
    
    let successCount = 0;
    let failCount = 0;
    let totalElapsed = 0;
    const latencies = [];
    let expectedMessages = 0;

    if (MODE === 'stress-burst') {
      expectedMessages = numUsers * MSG_PER_USER;
      const tasks = [];
      for (let u = 0; u < numUsers; u++) {
        for (let m = 0; m < MSG_PER_USER; m++) {
          tasks.push({ user: members[u], content: `Burst Msg ${m} from ${u}` });
        }
      }
      tasks.sort(() => Math.random() - 0.5); // Shuffle
      const { results, latencies: lats, totalElapsed: elapsed } = await runCoordinatedConcurrentDispatch(tasks, async (task) => {
        return await createMessage({ projectId: project._id, userId: task.user._id, content: task.content });
      });
      successCount = results.filter(r => r.success).length;
      failCount = results.filter(r => !r.success).length;
      totalElapsed = elapsed;
      latencies.push(...lats);
    } else if (MODE === 'stress-sustained') {
       const startTotal = performance.now();
       let isRunning = true;
       const workerLoop = async (user) => {
         while (isRunning) {
           const start = performance.now();
           try {
             await createMessage({ projectId: project._id, userId: user._id, content: `Sustained load` });
             latencies.push(performance.now() - start);
             successCount++;
             expectedMessages++;
           } catch (err) {
             latencies.push(performance.now() - start);
             failCount++;
           }
         }
       };
       const promises = members.map(user => workerLoop(user));
       await new Promise(r => setTimeout(r, DURATION_SEC * 1000));
       isRunning = false;
       await Promise.all(promises);
       totalElapsed = performance.now() - startTotal;
    }

    h.disable();
    const memEnd = process.memoryUsage();
    
    const msgPerSec = ((successCount / totalElapsed) * 1000);
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    
    // Persistence Check
    const persistedCount = await Message.countDocuments({ projectId: project._id });
    const missing = expectedMessages - persistedCount;
    const errorRate = (failCount / expectedMessages) * 100;
    
    // Health Evaluation (FAILED -> SATURATED -> DEGRADED -> HEALTHY)
    let status = 'healthy';
    let reason = '';
    
    const throughputChange = previousThroughput === 0 ? 100 : ((msgPerSec - previousThroughput) / previousThroughput) * 100;
    const latencyIncrease = previousP95 === 0 ? 0 : ((p95 - previousP95) / previousP95) * 100;

    if (failCount > (expectedMessages * 0.2)) {
      status = 'failed';
      reason = '>20% operations failed';
    } else if (missing > 0 && missing > (expectedMessages * 0.1)) {
      status = 'failed';
      reason = 'Severe persistence mismatch';
    } else if (errorRate >= 5 || p95 >= MAX_P95 || (previousThroughput > 0 && throughputChange < 5 && latencyIncrease > 50)) {
      status = 'saturated';
      reason = errorRate >= 5 ? 'Error rate >= 5%' : p95 >= MAX_P95 ? `p95 >= ${MAX_P95/1000}s` : 'Throughput plateaued while latency exploded';
      resultsJSON.summary.saturationStage = numUsers;
    } else if (errorRate >= 1 || p95 >= 2000) {
      status = 'degraded';
      reason = errorRate >= 1 ? 'Error rate >= 1%' : 'p95 >= 2s';
    } else {
      resultsJSON.summary.highestSuccessfulStage = numUsers;
    }
    
    if (msgPerSec > resultsJSON.summary.peakObservedThroughput) {
      resultsJSON.summary.peakObservedThroughput = msgPerSec;
    }
    
    if (status === 'failed') resultsJSON.summary.failureStage = numUsers;
    
    console.log(`Workload:   ${numUsers} users, ${expectedMessages} total operations`);
    console.log(`Throughput: ${msgPerSec.toFixed(0)} msg/s`);
    console.log(`Correct:    ${successCount} successful, ${failCount} failed, ${missing} missing`);
    console.log(`Latency:    p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
    console.log(`Event Loop: p99 lag ${((h.percentile(99) || 0) / 1e6).toFixed(2)}ms`);
    console.log(`Memory:     RSS: ${formatBytes(memEnd.rss)} | Heap: ${formatBytes(memEnd.heapUsed)}`);
    console.log(`Status:     ${status.toUpperCase()} ${reason ? `(${reason})` : ''}`);

    resultsJSON.stages.push({
      users: numUsers,
      totalOperations: expectedMessages,
      success: successCount,
      failed: failCount,
      missing,
      throughput: parseFloat(msgPerSec.toFixed(2)),
      p50: parseFloat(p50),
      p95: parseFloat(p95),
      p99: parseFloat(p99),
      memory: { rss: memEnd.rss, heapUsed: memEnd.heapUsed },
      eventLoop: { p99: (h.percentile(99) || 0) / 1e6 },
      status,
      reason
    });
    
    saveResults();
    
    previousThroughput = msgPerSec;
    previousP95 = p95;

    if (status === 'failed' || (status === 'saturated' && !IGNORE_SATURATION)) {
      console.log(`\nStopping ramp: system reached ${status} state.`);
      break;
    }
  }
  
  console.log(`\n==================================================`);
  console.log(`STRESS BENCHMARK SUMMARY`);
  console.log(`==================================================`);
  if (!resultsJSON.summary.failureStage && !resultsJSON.summary.saturationStage) {
    console.log(`No breaking point observed within the tested range.`);
  } else {
    console.log(`Highest completed stage: ${resultsJSON.summary.highestSuccessfulStage || 'None'} concurrent users`);
    console.log(`Peak observed throughput: ${resultsJSON.summary.peakObservedThroughput.toFixed(0)} msg/s`);
    console.log(`Saturation detected: ${resultsJSON.summary.saturationStage ? 'YES' : 'NO'}`);
    if (resultsJSON.summary.saturationStage) console.log(`Saturation stage: ${resultsJSON.summary.saturationStage} users`);
    console.log(`Failure detected: ${resultsJSON.summary.failureStage ? 'YES' : 'NO'}`);
    if (resultsJSON.summary.failureStage) console.log(`Failure stage: ${resultsJSON.summary.failureStage} users`);
  }
  console.log(`JSON Results: ${jsonPath}`);
  console.log(`==================================================`);
};

const runBenchmarks = async () => {
  let mongoServer;
  try {
    console.log("PROJECTFORGE CHAT CAPACITY BENCHMARK");
    console.log(`Node: ${process.version}`);
    console.log(`MongoDB: MongoDB Memory Server (Replica Set)`);
    console.log(`CPU: ${os.cpus()[0].model} (${os.cpus().length} cores)`);
    console.log(`RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Date: ${new Date().toISOString()}`);

    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());
    
    // Explicitly create all collections
    const models = mongoose.connection.models;
    for (const key in models) {
      await models[key].createCollection();
    }

    const owner = await createUser();
    const project = await createProject(owner._id);
    await createTeamMember(project._id, owner._id);

    if (MODE === 'stress-burst' || MODE === 'stress-sustained') {
      await benchmarkStressRamp(project);
    } else {
      // 1. Burst Write Tests
      const userLevels = [10, 20, 50, 100, 200, 500, 1000];
      // We already have this data from the previous run, we can skip running it to save time,
      // or run a smaller subset just to verify. I'll just skip to the matrix tests.

      // 2. Controlled Workload Matrix
      await benchmarkControlledWorkload(project, [10, 50], [10, 50, 100]);

      // 3. Read Tests (Using the DB populated by the matrix writes)
      const readerLevels = [10, 50, 100, 500];
      await benchmarkConcurrentReads(project, readerLevels);
    }

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
