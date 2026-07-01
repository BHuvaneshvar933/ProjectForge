import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import "./src/models/index.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import { initializeSocket } from "./src/sockets/socket.js";
import jwt from "jsonwebtoken";
import User from "./src/models/user.model.js";


dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect DB
await connectDB();

// HTTP server
const server = http.createServer(app);

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
};

const isOriginAllowed = (origin, allowed) => {
  if (!origin) return true;
  const originNorm = String(origin).trim().replace(/\/+$/, "");
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  if (allowed.includes("*")) return true;
  if (allowed.includes(originNorm)) return true;

  let originUrl;
  try {
    originUrl = new URL(originNorm);
  } catch {
    return false;
  }

  for (const rawEntry of allowed) {
    const entry = String(rawEntry || "").trim().replace(/\/+$/, "");
    if (typeof entry !== "string" || !entry.includes("*")) continue;

    const hasProto = entry.includes("://");
    const protocol = hasProto ? entry.split("://")[0] : "";
    const patternHost = (hasProto ? entry.split("://")[1] : entry).trim();
    if (!patternHost) continue;

    const suffix = patternHost.replace(/^\*\./, "");
    if (!suffix) continue;

    if (hasProto && originUrl.protocol.replace(":", "") !== protocol) continue;
    if (originUrl.hostname === suffix || originUrl.hostname.endsWith(`.${suffix}`)) return true;
  }

  return false;
};

// Socket.io server
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  cookie: false,
  cors: {
    origin: (origin, cb) => {
      const allowed = parseAllowedOrigins(process.env.CLIENT_ORIGIN);
      if (isOriginAllowed(origin, allowed)) return cb(null, true);
      const err = new Error("CORS: origin not allowed");
      err.statusCode = 403;
      return cb(err);
    },
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
