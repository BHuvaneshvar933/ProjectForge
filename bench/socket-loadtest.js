import { io } from "socket.io-client";

const getEnv = (key, fallback = "") => {
  const v = process.env[key];
  return v === undefined || v === null || v === "" ? fallback : v;
};

const SOCKET_URL = getEnv("PF_SOCKET_URL", "http://localhost:5000");
const TOKEN = getEnv("PF_TOKEN", "");
const PROJECT_ID = getEnv("PF_PROJECT_ID", "");
const CONCURRENCY = Number.parseInt(getEnv("PF_CONCURRENCY", "50"), 10);
const MESSAGES_PER_CLIENT = Number.parseInt(getEnv("PF_MESSAGES_PER_CLIENT", "2"), 10);

if (!TOKEN) {
  console.error("Missing PF_TOKEN (JWT token, without 'Bearer ')");
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error("Missing PF_PROJECT_ID (projectId where user is an active member)");
  process.exit(1);
}

const nowMs = () => Number(process.hrtime.bigint() / 1000000n);

const stats = {
  connected: 0,
  joinOk: 0,
  joinFail: 0,
  sendOk: 0,
  sendFail: 0,
  recv: 0,
  latenciesMs: [],
};

const clients = [];
const sendAtByPayload = new Map();

const percentile = (arr, p) => {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
};

const createClient = (i) => {
  const socket = io(SOCKET_URL, {
    auth: { token: `Bearer ${TOKEN}` },
    transports: ["websocket"],
    reconnection: false,
  });

  socket.on("connect", () => {
    stats.connected += 1;

    socket.emit("join-project", PROJECT_ID, (res) => {
      if (res?.ok) stats.joinOk += 1;
      else stats.joinFail += 1;

      // Send a few messages to measure ack and receive latency.
      for (let n = 0; n < MESSAGES_PER_CLIENT; n += 1) {
        const payloadId = `${i}-${n}-${Date.now()}`;
        const content = `bench:${payloadId}`;
        sendAtByPayload.set(payloadId, nowMs());

        socket.emit("send-message", { projectId: PROJECT_ID, content }, (ack) => {
          if (ack?.ok) stats.sendOk += 1;
          else stats.sendFail += 1;
        });
      }
    });
  });

  socket.on("new-message", (msg) => {
    const content = msg?.content;
    if (typeof content !== "string") return;
    if (!content.startsWith("bench:")) return;

    const payloadId = content.slice("bench:".length);
    const sentAt = sendAtByPayload.get(payloadId);
    if (typeof sentAt !== "number") return;

    stats.recv += 1;
    stats.latenciesMs.push(nowMs() - sentAt);
    sendAtByPayload.delete(payloadId);
  });

  socket.on("connect_error", () => {
    stats.joinFail += 1;
  });

  clients.push(socket);
};

for (let i = 0; i < CONCURRENCY; i += 1) {
  createClient(i);
}

const totalExpectedReceives = CONCURRENCY * MESSAGES_PER_CLIENT;

const printSummary = () => {
  const p50 = percentile(stats.latenciesMs, 50);
  const p95 = percentile(stats.latenciesMs, 95);
  const avg = stats.latenciesMs.length
    ? Math.round(stats.latenciesMs.reduce((a, b) => a + b, 0) / stats.latenciesMs.length)
    : null;

  console.log("\nSocket Benchmark Summary");
  console.log("url:", SOCKET_URL);
  console.log("concurrency:", CONCURRENCY);
  console.log("messages/client:", MESSAGES_PER_CLIENT);
  console.log("connected:", stats.connected);
  console.log("join ok/fail:", stats.joinOk, "/", stats.joinFail);
  console.log("send ok/fail:", stats.sendOk, "/", stats.sendFail);
  console.log("received:", stats.recv, "/", totalExpectedReceives);
  console.log("latency ms avg/p50/p95:", avg, "/", p50, "/", p95);
};

const deadline = Date.now() + 30000;

const interval = setInterval(() => {
  if (stats.recv >= totalExpectedReceives) {
    clearInterval(interval);
    printSummary();
    for (const s of clients) s.disconnect();
    process.exit(0);
  }

  if (Date.now() > deadline) {
    clearInterval(interval);
    printSummary();
    for (const s of clients) s.disconnect();
    process.exit(0);
  }
}, 500);
