import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import "./src/models/index.js";
import { initializeSocket } from "./src/sockets/socket.js";
import jwt from "jsonwebtoken";
import User from "./src/models/user.model.js";


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

io.use(async (socket, next) => {
  try {
    const raw = socket.handshake.auth?.token;

    if (!raw || typeof raw !== "string") {
      return next(new Error("Unauthorized: No token"));
    }

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Unauthorized: User not found"));
    }

    socket.user = user;

    next();
  } catch (err) {
    next(new Error("Unauthorized: Invalid token"));
  }
});

initializeSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
