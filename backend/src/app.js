import express from "express";
import cors from "cors";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import applicationRoutes from "./routes/applications.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173", 
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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", taskRoutes);

app.use(errorHandler);
export default app;