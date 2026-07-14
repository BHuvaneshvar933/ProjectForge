import { registerSocketHandlers } from "./socketHandlers.js";

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);

    socket.on("disconnect", () => {
    });
  });
};