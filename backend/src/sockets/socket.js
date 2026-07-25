import { registerSocketHandlers } from "./socketHandlers.js";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

export const initializeSocket = (io) => {
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);

    socket.on("disconnect", () => {
    });
  });
};