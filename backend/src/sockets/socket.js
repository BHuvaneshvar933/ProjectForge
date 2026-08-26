import { registerSocketHandlers } from "./socketHandlers.js";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

let ioInstance;

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized!");
  }
  return ioInstance;
};

export const initializeSocket = (io) => {
  ioInstance = io;

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) => console.error("Redis PubClient Error:", err.message));
    subClient.on("error", (err) => console.error("Redis SubClient Error:", err.message));

    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);

    socket.on("disconnect", () => {
    });
  });
};