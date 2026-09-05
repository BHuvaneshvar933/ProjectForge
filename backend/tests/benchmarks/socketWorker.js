import { parentPort, workerData } from "worker_threads";
import { io } from "socket.io-client";

// We'll map userId to socket instance
const sockets = new Map();
let currentScenario = null;

// Metrics
const metrics = {
  connected: 0,
  failed: 0,
  disconnects: 0,
  connectLatencies: [],
  emitToAckLatencies: [],
  emitToReceiveLatencies: [], // E2E
  sent: 0,
  received: 0,
  duplicates: 0,
  lost: 0
};

// Maps for tracking exact message times
const pendingMessages = new Map(); // msgId -> emitTime

const connectClients = async (clients, url) => {
  return new Promise((resolve) => {
    let attempted = 0;
    
    clients.forEach((client) => {
      const startTime = Date.now();
      const socket = io(url, {
        auth: { token: `Bearer ${client.token}` },
        transports: ["websocket"], // force websocket
        reconnection: true
      });

      socket.on("connect", () => {
        metrics.connected++;
        metrics.connectLatencies.push(Date.now() - startTime);
        
        // After connect, join the user's project rooms
        if (client.projectIds) {
           client.projectIds.forEach(pid => {
             socket.emit("join-project", pid, () => {});
           });
        }
        
        attempted++;
        if (attempted === clients.length) resolve();
      });

      socket.on("connect_error", (err) => {
        metrics.failed++;
        attempted++;
        if (attempted === clients.length) resolve();
      });

      socket.on("disconnect", () => {
        metrics.disconnects++;
      });

      // Listen for broadcasts
      socket.on("new-message", (msg) => {
        metrics.received++;
        
        // Is this a message we sent, or someone else?
        // Let's check if we have a track record for this emit
        if (msg.content && msg.content.startsWith("BENCH_")) {
          const emitTimestamp = msg.content.split("_")[1];
          const emitTime = parseInt(emitTimestamp, 10);
          metrics.emitToReceiveLatencies.push(Date.now() - emitTime);
        }
      });

      sockets.set(client.userId, socket);
    });
    
    if (clients.length === 0) resolve();
  });
};

const disconnectClients = () => {
  for (const socket of sockets.values()) {
    socket.disconnect();
  }
  sockets.clear();
};

parentPort.on("message", async (msg) => {
  try {
    switch (msg.type) {
      case "CONNECT":
        await connectClients(msg.clients, msg.url);
        parentPort.postMessage({ type: "CONNECT_DONE", metrics });
        break;

      case "DISCONNECT":
        disconnectClients();
        parentPort.postMessage({ type: "DISCONNECT_DONE" });
        break;

      case "EMIT_MESSAGES":
        const { tasks } = msg;
        let completed = 0;
        
        tasks.forEach(task => {
          const socket = sockets.get(task.userId);
          if (!socket || !socket.connected) {
             metrics.lost++;
             completed++;
             if (completed === tasks.length) parentPort.postMessage({ type: "EMIT_DONE", metrics });
             return;
          }

          const emitTime = Date.now();
          // Payload contains emit time so receivers can calculate E2E latency
          const payload = {
            projectId: task.projectId,
            content: `BENCH_${emitTime}_${task.userId}_${Math.random()}`,
            attachments: []
          };

          socket.emit("send-message", payload, (response) => {
             const ackTime = Date.now();
             if (response && response.ok) {
               metrics.sent++;
               metrics.emitToAckLatencies.push(ackTime - emitTime);
             } else {
               metrics.lost++;
             }
             
             completed++;
             if (completed === tasks.length) {
               parentPort.postMessage({ type: "EMIT_DONE", metrics });
             }
          });
        });
        
        if (tasks.length === 0) {
           parentPort.postMessage({ type: "EMIT_DONE", metrics });
        }
        break;

      case "GET_METRICS":
        parentPort.postMessage({ type: "METRICS", metrics });
        break;
        
      case "RESET_METRICS":
        metrics.connected = 0;
        metrics.failed = 0;
        metrics.disconnects = 0;
        metrics.connectLatencies = [];
        metrics.emitToAckLatencies = [];
        metrics.emitToReceiveLatencies = [];
        metrics.sent = 0;
        metrics.received = 0;
        metrics.duplicates = 0;
        metrics.lost = 0;
        parentPort.postMessage({ type: "RESET_DONE" });
        break;
    }
  } catch (err) {
    parentPort.postMessage({ type: "ERROR", error: err.message });
  }
});
