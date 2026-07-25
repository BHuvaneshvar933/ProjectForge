import express from "express";
import cors from "cors";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import applicationRoutes from "./routes/applications.routes.js";
import taskRoutes from "./routes/task.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import directMessageRoutes from "./routes/directMessage.routes.js";
import { setupSwagger } from "./docs/swagger.js";

const app = express();

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

  // Explicit allow-all.
  if (allowed.includes("*")) return true;

  // Exact match first.
  if (allowed.includes(originNorm)) return true;

  // Wildcards: allow entries like `https://*.vercel.app` or `*.vercel.app`.
  let originUrl;
  try {
    originUrl = new URL(originNorm);
  } catch {
    return false;
  }

  for (const rawEntry of allowed) {
    const entry = String(rawEntry || "").trim().replace(/\/+$/, "");
    if (typeof entry !== "string" || !entry.includes("*")) continue;

    // If entry includes protocol, enforce it.
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

// Middlewares
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = parseAllowedOrigins(process.env.CLIENT_ORIGIN);

      // Allow non-browser clients / same-origin (no Origin header)
      if (!origin) return cb(null, true);

      if (isOriginAllowed(origin, allowed)) return cb(null, true);
      const err = new Error("CORS: origin not allowed");
      err.statusCode = 403;
      return cb(err);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ProjectForge API is running"
  });
});

import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", taskRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/direct-messages", directMessageRoutes);

setupSwagger(app);

app.use(errorHandler);
export default app;
