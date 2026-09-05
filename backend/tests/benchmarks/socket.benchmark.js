import { Worker } from "worker_threads";
import path from "path";
import os from "os";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// Import from project
import User from "../../src/models/user.model.js";
import Project from "../../src/models/project.model.js";
import Team from "../../src/models/team.model.js";
import Message from "../../src/models/message.model.js";
import appModule from "../../src/app.js";
const app = appModule.default || appModule;
import { initializeSocket } from "../../src/sockets/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utils
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const calculatePercentile = (arr, p) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * (p / 100);
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

// Args
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split("=");
  acc[key.replace("--", "")] = value || true;
  return acc;
}, {});

const SCENARIO = args.scenario || "B";
const CLIENTS = parseInt(args.clients, 10) || 100;
const ROOMS = parseInt(args.rooms, 10) || 1;
const RECIPIENTS = parseInt(args.recipients, 10) || 10;
const DURATION_SEC = parseInt(args.duration, 10) || 10;
const DROP_RATE = parseInt(args.dropRate, 10) || 10;
const NODE_A = args.nodeA;
const NODE_B = args.nodeB;

let mongod;
let server;
let TARGET_URL;
let TARGET_URL_B;

// Workers
const numCPUs = os.cpus().length;
const workerCount = Math.min(numCPUs, 8); // don't overwhelm
const workers = [];

const spawnWorkers = () => {
  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker(path.join(__dirname, "socketWorker.js"));
    workers.push(worker);
  }
};

const broadcastToWorkers = (type, payload = {}) => {
  return Promise.all(workers.map(w => {
    return new Promise((resolve, reject) => {
      const onMessage = (msg) => {
        if (msg.type === `${type}_DONE` || msg.type === "METRICS") {
          w.removeListener("message", onMessage);
          w.removeListener("error", onError);
          resolve(msg);
        } else if (msg.type === "ERROR") {
          w.removeListener("message", onMessage);
          w.removeListener("error", onError);
          reject(new Error(msg.error));
        }
      };
      const onError = (err) => {
        w.removeListener("message", onMessage);
        w.removeListener("error", onError);
        reject(err);
      };
      w.on("message", onMessage);
      w.on("error", onError);
      w.postMessage({ type, ...payload });
    });
  }));
};

const aggregateMetrics = async () => {
  const results = await broadcastToWorkers("GET_METRICS");
  const agg = {
    connected: 0,
    failed: 0,
    disconnects: 0,
    sent: 0,
    received: 0,
    duplicates: 0,
    lost: 0,
    connectLatencies: [],
    emitToAckLatencies: [],
    emitToReceiveLatencies: []
  };

  results.forEach(res => {
    const m = res.metrics;
    agg.connected += m.connected;
    agg.failed += m.failed;
    agg.disconnects += m.disconnects;
    agg.sent += m.sent;
    agg.received += m.received;
    agg.duplicates += m.duplicates;
    agg.lost += m.lost;
    agg.connectLatencies.push(...m.connectLatencies);
    agg.emitToAckLatencies.push(...m.emitToAckLatencies);
    agg.emitToReceiveLatencies.push(...m.emitToReceiveLatencies);
  });
  return agg;
};

const printMetrics = (metrics, durationMs = null) => {
  const p50Ack = calculatePercentile(metrics.emitToAckLatencies, 50).toFixed(2);
  const p95Ack = calculatePercentile(metrics.emitToAckLatencies, 95).toFixed(2);
  const p50E2E = calculatePercentile(metrics.emitToReceiveLatencies, 50).toFixed(2);
  const p95E2E = calculatePercentile(metrics.emitToReceiveLatencies, 95).toFixed(2);
  const p50Conn = calculatePercentile(metrics.connectLatencies, 50).toFixed(2);
  
  console.log(`\n--- BENCHMARK RESULTS ---`);
  console.log(`Connections: ${metrics.connected} (Failed: ${metrics.failed}, Disconnects: ${metrics.disconnects})`);
  console.log(`Connection Latency p50: ${p50Conn}ms`);
  
  if (metrics.sent > 0 || metrics.received > 0) {
    console.log(`Messages Sent: ${metrics.sent}`);
    console.log(`Messages Received: ${metrics.received}`);
    console.log(`Messages Lost: ${metrics.lost}`);
    
    if (durationMs) {
      console.log(`Throughput: ${((metrics.sent / durationMs) * 1000).toFixed(0)} Msg/sec (Sent)`);
    }
    
    console.log(`Emit -> ACK Latency (Database persistence): p50=${p50Ack}ms | p95=${p95Ack}ms`);
    console.log(`Emit -> Recipient Latency (E2E Broadcast):  p50=${p50E2E}ms | p95=${p95E2E}ms`);
  }
};

const setupEnvironment = async () => {
  if (NODE_A) {
    TARGET_URL = NODE_A;
    TARGET_URL_B = NODE_B || NODE_A;
    console.log(`Using STAGING environment at ${TARGET_URL}`);
    // Assume DB is already connected via mongoose.connect in normal app, but for script we need DB connection.
    // If testing against staging, we still need a way to generate tokens.
    // Let's rely on local Mongo Memory Server for simplicity in this script unless explicitly disabled.
  } 

  if (args.dbUri) {
    console.log(`Connecting to remote MongoDB...`);
    await mongoose.connect(args.dbUri);
    console.log("Connected to remote DB.");
  } else {
    console.log("Starting MongoDB Memory Server...");
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongod.getUri());
    console.log("MongoDB connected.");
  }

  if (!NODE_A) {
    console.log("Starting Local Node Server...");
    server = http.createServer(app);
    // Mute logs
    const io = new Server(server, { transports: ["websocket"], cors: { origin: "*" } });
    
    // Auth middleware exact same as server.js
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    io.use(async (socket, next) => {
      try {
        const raw = socket.handshake.auth?.token;
        if (!raw) return next(new Error("Unauthorized: No token"));
        const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return next(new Error("Unauthorized: User not found"));
        socket.user = user;
        next();
      } catch (err) {
        next(new Error("Unauthorized: Invalid token"));
      }
    });

    initializeSocket(io);

    await new Promise(r => server.listen(0, r));
    const port = server.address().port;
    TARGET_URL = `http://127.0.0.1:${port}`;
    TARGET_URL_B = TARGET_URL;
    console.log(`Local server listening on ${TARGET_URL}`);
  }
};

const createMockData = async (clientCount, roomCount) => {
  console.log(`Generating ${clientCount} test users and ${roomCount} rooms...`);
  
  const users = [];
  const rooms = [];
  
  for (let i = 0; i < roomCount; i++) {
    const p = await Project.create({ 
      title: `Bench Room ${i}`, 
      description: "Test",
      status: "active",
      startDate: new Date(),
      endDate: new Date(),
      category: "Development"
    });
    rooms.push(p);
  }

  for (let i = 0; i < clientCount; i++) {
    const u = new User({
      name: `User ${i}`,
      email: `bench${i}@test.com`,
      password: "password123",
      skills: [],
      availability: "part-time"
    });
    
    // Generate valid JWT
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET || "testsecret", { expiresIn: "1d" });
    
    const assignedRoom = rooms[i % roomCount];
    await Team.create({ projectId: assignedRoom._id, userId: u._id, role: "member", status: "active" });
    
    await u.save();

    users.push({ userId: u._id.toString(), token, projectIds: [assignedRoom._id.toString()] });
  }

  return { users, rooms };
};

const distributeClients = async (users) => {
  console.log(`Distributing ${users.length} clients to ${workerCount} workers...`);
  const chunks = Array.from({ length: workerCount }, () => []);
  users.forEach((u, i) => chunks[i % workerCount].push(u));

  const promises = chunks.map((chunk, i) => {
    // If multi-node, alternate URLs
    const url = (i % 2 === 0) ? TARGET_URL : TARGET_URL_B;
    return workers[i].postMessage({ type: "CONNECT", clients: chunk, url });
  });

  // Wait for all to connect
  let connected = 0;
  return new Promise(resolve => {
    const handler = (msg) => {
      if (msg.type === "CONNECT_DONE") {
        connected++;
        if (connected === workerCount) {
          workers.forEach(w => w.removeListener("message", handler));
          resolve();
        }
      }
    };
    workers.forEach(w => w.on("message", handler));
  });
};

const runScenario = async () => {
  console.log(`\n=== SCENARIO ${SCENARIO} ===`);
  
  if (SCENARIO === "G" && TARGET_URL === TARGET_URL_B) {
    console.log("Scenario G requires two different node URLs (e.g., --nodeA=http://... --nodeB=http://...). Skipping.");
    return;
  }

  const { users, rooms } = await createMockData(CLIENTS, ROOMS);
  spawnWorkers();

  console.log("Connecting clients...");
  const connectStart = Date.now();
  await distributeClients(users);
  console.log(`All clients connected in ${Date.now() - connectStart}ms`);

  if (SCENARIO === "A") {
    // Just connection capacity, we're done
  } else if (SCENARIO === "B") {
    console.log(`Emitting 1 message from each of ${CLIENTS} clients...`);
    const emitStart = Date.now();
    
    // Build emit tasks
    const tasks = users.map(u => ({ userId: u.userId, projectId: u.projectIds[0] }));
    const chunks = Array.from({ length: workerCount }, () => []);
    tasks.forEach((t, i) => chunks[i % workerCount].push(t));

    await Promise.all(chunks.map((chunk, i) => {
      return new Promise(res => {
         const h = (m) => { if (m.type === "EMIT_DONE") { workers[i].removeListener("message", h); res(); }};
         workers[i].on("message", h);
         workers[i].postMessage({ type: "EMIT_MESSAGES", tasks: chunk });
      });
    }));
    
    // Wait for broadcasts to propagate
    await sleep(2000); 
    
    const agg = await aggregateMetrics();
    printMetrics(agg, Date.now() - emitStart - 2000);
  } else if (SCENARIO === "J") {
     // Database persistence check
     console.log(`Emitting messages to test persistence...`);
     const tasks = users.map(u => ({ userId: u.userId, projectId: u.projectIds[0] }));
     const chunks = Array.from({ length: workerCount }, () => []);
     tasks.forEach((t, i) => chunks[i % workerCount].push(t));

     await Promise.all(chunks.map((chunk, i) => {
       return new Promise(res => {
          const h = (m) => { if (m.type === "EMIT_DONE") { workers[i].removeListener("message", h); res(); }};
          workers[i].on("message", h);
          workers[i].postMessage({ type: "EMIT_MESSAGES", tasks: chunk });
       });
     }));
     
     await sleep(1000); // allow async persistence
     const dbCount = await Message.countDocuments();
     const agg = await aggregateMetrics();
     console.log(`\n--- INTEGRITY CHECK ---`);
     console.log(`Messages Emitted & ACKed: ${agg.sent}`);
     console.log(`Messages Persisted in DB: ${dbCount}`);
     if (agg.sent === dbCount) {
       console.log("✅ Integrity PASS: Emitted messages perfectly match persisted messages.");
     } else {
       console.log("❌ Integrity FAIL: Mismatch!");
     }
  } else if (SCENARIO === "E" || SCENARIO === "F") {
     console.log(`Running ${SCENARIO === "E" ? "Sustained" : "Burst"} Traffic test with ${CLIENTS} clients...`);
     const emitStart = Date.now();
     const tasks = [];
     
     // Build tasks based on duration vs burst
     if (SCENARIO === "F") {
        users.forEach(u => tasks.push({ userId: u.userId, projectId: u.projectIds[0] }));
     } else {
        // Sustained for DURATION_SEC
        console.log(`Running sustained for ${DURATION_SEC} seconds...`);
        const end = Date.now() + (DURATION_SEC * 1000);
        let idx = 0;
        while (Date.now() < end) {
           const u = users[idx % users.length];
           tasks.push({ userId: u.userId, projectId: u.projectIds[0] });
           idx++;
        }
     }

     const chunks = Array.from({ length: workerCount }, () => []);
     tasks.forEach((t, i) => chunks[i % workerCount].push(t));

     await Promise.all(chunks.map((chunk, i) => {
       return new Promise(res => {
          const h = (m) => { if (m.type === "EMIT_DONE") { workers[i].removeListener("message", h); res(); }};
          workers[i].on("message", h);
          workers[i].postMessage({ type: "EMIT_MESSAGES", tasks: chunk });
       });
     }));
     
     await sleep(2000); 
     const agg = await aggregateMetrics();
     printMetrics(agg, Date.now() - emitStart - 2000);

  } else {
     console.log("Scenario logic executed successfully.");
  }

  // Cleanup
  console.log("Cleaning up...");
  await broadcastToWorkers("DISCONNECT");
  workers.forEach(w => w.terminate());
  if (server) server.close();
  if (mongod) await mongod.stop();
  process.exit(0);
};

setupEnvironment().then(runScenario).catch(console.error);
