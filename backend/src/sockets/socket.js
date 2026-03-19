import { verifyToken } from "../utils/jwt.js";
import { registerSocketHandlers } from "./socketHandlers.js";

export const initializeSocket = (io) => {
  // JWT auth middleware
  io.use((socket, next) => {
    try {
      const raw = socket.handshake?.auth?.token;

      if (!raw || typeof raw !== "string") {
        return next(new Error("Authentication error"));
      }

      const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
      const decoded = verifyToken(token);

      socket.user = { id: decoded.id };
      return next();
    } catch {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Safety guard: disconnect if auth middleware didn't attach user
    if (!socket.user || !socket.user.id) {
      socket.disconnect(true);
      return;
    }

    registerSocketHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
