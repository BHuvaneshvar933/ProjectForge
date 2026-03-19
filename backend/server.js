import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import "./src/models/index.js";
import { initializeSocket } from "./src/sockets/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect DB
await connectDB();

// HTTP server
const server = http.createServer(app);

// Socket.io server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
