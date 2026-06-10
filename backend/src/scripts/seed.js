import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Skill from "../models/skill.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import Application from "../models/application.model.js";
import Task from "../models/task.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";

import connectDB from "../config/db.js";
import { hashPassword } from "../utils/password.js";


const DEMO_TAG = "demo:projectforge";

const now = () => new Date();

const isReset = process.argv.includes("--reset");

const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const pick = (arr, n) => {
  const a = Array.isArray(arr) ? [...arr] : [];
  const out = [];
  while (a.length && out.length < n) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
};

const ensureSkills = async () => {
  const skillDefs = [
    { name: "JavaScript", category: "web", aliases: ["js"] },
    { name: "TypeScript", category: "web", aliases: ["ts"] },
    { name: "React", category: "web", aliases: [] },
    { name: "Node.js", category: "web", aliases: ["node"] },
    { name: "Express", category: "web", aliases: [] },
    { name: "MongoDB", category: "web", aliases: [] },
    { name: "Socket.io", category: "web", aliases: ["socketio"] },
    { name: "Python", category: "ml", aliases: [] },
    { name: "FastAPI", category: "web", aliases: [] },
    { name: "Docker", category: "web", aliases: [] },
    { name: "UI/UX", category: "web", aliases: ["design"] },
    { name: "Figma", category: "web", aliases: [] },
    { name: "ML", category: "ml", aliases: ["machine learning"] },
    { name: "NLP", category: "ml", aliases: [] },
    { name: "PostgreSQL", category: "web", aliases: [] },
  ];

  const existing = await Skill.find({ name: { $in: skillDefs.map((s) => s.name) } }).lean();
  const byName = new Map(existing.map((s) => [s.name, s]));

  for (const s of skillDefs) {
    if (byName.has(s.name)) continue;
    await Skill.create({
      ...s,
      popularityCount: 0,
    });
  }

  const all = await Skill.find({ name: { $in: skillDefs.map((s) => s.name) } })
    .sort({ name: 1 })
    .lean();

  return all;
};

const ensureUsers = async (skills) => {
  const byName = (name) => skills.find((s) => s.name === name)?._id;

  const users = [
    { name: "Alice Chen", email: "alice@example.com", password: "password123", bio: "Full Stack Developer who loves building scalable web apps.", skills: [byName("React"), byName("Node.js"), byName("TypeScript"), byName("MongoDB")].filter(Boolean) },
    { name: "Bob Smith", email: "bob@example.com", password: "password123", bio: "Data Scientist focusing on predictive modeling and NLP.", skills: [byName("Python"), byName("ML"), byName("NLP")].filter(Boolean) },
    { name: "Charlie Davis", email: "charlie@example.com", password: "password123", bio: "Creative UI/UX Designer aiming for intuitive interfaces.", skills: [byName("UI/UX"), byName("Figma")].filter(Boolean) },
    { name: "Diana Prince", email: "diana@example.com", password: "password123", bio: "Backend Engineer building high-performance APIs.", skills: [byName("Python"), byName("FastAPI"), byName("PostgreSQL")].filter(Boolean) },
    { name: "Evan Wright", email: "evan@example.com", password: "password123", bio: "Frontend Developer creating responsive user experiences.", skills: [byName("JavaScript"), byName("React"), byName("UI/UX")].filter(Boolean) },
    { name: "Fiona Gallagher", email: "fiona@example.com", password: "password123", bio: "DevOps Engineer streamlining deployment pipelines.", skills: [byName("Docker"), byName("Node.js"), byName("MongoDB")].filter(Boolean) },
    { name: "George Martin", email: "george@example.com", password: "password123", bio: "Mobile Developer with a knack for cross-platform apps.", skills: [byName("React"), byName("TypeScript")].filter(Boolean) },
    { name: "Hannah Abbott", email: "hannah@example.com", password: "password123", bio: "Machine Learning Engineer exploring neural networks.", skills: [byName("Python"), byName("ML"), byName("PostgreSQL")].filter(Boolean) },
    { name: "Ian Malcolm", email: "ian@example.com", password: "password123", bio: "System Architect designing robust cloud infrastructure.", skills: [byName("MongoDB"), byName("Express"), byName("React"), byName("Node.js")].filter(Boolean) },
    { name: "Julia Roberts", email: "julia@example.com", password: "password123", bio: "Product Manager bridging the gap between design and engineering.", skills: [byName("UI/UX"), byName("JavaScript"), byName("Figma")].filter(Boolean) },
  ];

  const out = {};

  for (const u of users) {
    const existing = await User.findOne({ email: u.email }).select("_id").lean();
    if (existing) {
      const updated = await User.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            name: u.name,
            bio: u.bio,
            skills: u.skills,
            isActive: true,
            deletedAt: null,
            portfolioLinks: {
              github: "https://github.com/demo",
              linkedin: "https://linkedin.com/in/demo",
              website: "https://example.com",
            },
          },
        },
        { returnDocument: "after" }
      ).lean();

      out[u.email] = updated;
      continue;
    }

    const hashed = await hashPassword(u.password);
    const created = await User.create({
      name: u.name,
      email: u.email,
      password: hashed,
      bio: u.bio,
      skills: u.skills,
      availabilityHoursPerWeek: 8,
      portfolioLinks: {
        github: "https://github.com/demo",
        linkedin: "https://linkedin.com/in/demo",
        website: "https://example.com",
      },
      stats: {},
      isActive: true,
      deletedAt: null,
      lastLoginAt: null,
    });

    out[u.email] = created.toObject();
  }

  return out;
};

const createProjectIfMissing = async ({ ownerId, title, description, projectType, requiredSkills, openRoles, teamSizeRequired }) => {
  const existing = await Project.findOne({ title, tags: DEMO_TAG, isDeleted: false }).lean();
  if (existing) return existing;

  const project = await Project.create({
    title,
    description,
    owner: ownerId,
    requiredSkills,
    openRoles,
    teamSizeRequired,
    currentTeamSize: 1,
    projectType,
    status: "recruiting",
    visibility: "public",
    featured: false,
    tags: [DEMO_TAG],
    metrics: {
      totalTasks: 0,
      completedTasks: 0,
      totalHoursLogged: 0,
      velocityScore: 0,
      completionPercentage: 0,
    },
    timeline: {
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      estimatedDuration: 5,
    },
    viewCount: 0,
    isDeleted: false,
    deletedAt: null,
  });

  // owner team membership
  await Team.updateOne(
    { projectId: project._id, userId: ownerId },
    {
      $setOnInsert: {
        projectId: project._id,
        userId: ownerId,
        role: "owner",
        status: "active",
        projectRole: "Project Owner",
        joinedAt: now(),
        isDeleted: false,
        deletedAt: null,
      },
    },
    { upsert: true }
  );

  return project.toObject();
};

const resetDemoData = async () => {
  // Only delete records that are clearly demo-owned.
  const demoProjects = await Project.find({ tags: DEMO_TAG }).select("_id").lean();
  const demoProjectIds = demoProjects.map((p) => p._id);

  await Promise.all([
    Team.deleteMany({ projectId: { $in: demoProjectIds } }),
    Application.deleteMany({ projectId: { $in: demoProjectIds } }),
    Task.deleteMany({ projectId: { $in: demoProjectIds } }),
    Message.deleteMany({ projectId: { $in: demoProjectIds } }),
  ]);

  await Project.deleteMany({ tags: DEMO_TAG });

  // Notifications: remove ones created by this seed script.
  await Notification.deleteMany({ title: { $regex: "^Demo:", $options: "i" } });
};

const main = async () => {
  dotenv.config();
  must(process.env.MONGO_URI, "MONGO_URI missing");
  must(process.env.JWT_SECRET, "JWT_SECRET missing");

  await connectDB();

  if (isReset) {
    await resetDemoData();
    console.log("✅ Demo data reset complete");
    await mongoose.disconnect();
    return;
  }

  const skills = await ensureSkills();
  const users = await ensureUsers(skills);

  const alice = users["alice@example.com"];
  const bob = users["bob@example.com"];
  const charlie = users["charlie@example.com"];
  const diana = users["diana@example.com"];
  const evan = users["evan@example.com"];
  const fiona = users["fiona@example.com"];
  const george = users["george@example.com"];
  const hannah = users["hannah@example.com"];
  const ian = users["ian@example.com"];
  const julia = users["julia@example.com"];

  const skillBy = (name) => skills.find((s) => s.name === name)?._id;

  // Projects
  const p1 = await createProjectIfMissing({
    ownerId: ian._id,
    title: "E-Commerce Platform Redesign",
    description: "Modernizing a legacy e-commerce platform with MERN stack.",
    projectType: "web",
    requiredSkills: [skillBy("React"), skillBy("Node.js"), skillBy("MongoDB"), skillBy("TypeScript")].filter(Boolean),
    openRoles: ["Frontend Developer", "Backend Developer", "UI/UX Designer"],
    teamSizeRequired: 4,
  });

  const p2 = await createProjectIfMissing({
    ownerId: bob._id,
    title: "AI Recommendation Engine",
    description: "Building an ML pipeline for product recommendations.",
    projectType: "ml",
    requiredSkills: [skillBy("Python"), skillBy("ML"), skillBy("NLP"), skillBy("FastAPI")].filter(Boolean),
    openRoles: ["ML Engineer", "Backend Engineer"],
    teamSizeRequired: 3,
  });

  const p3 = await createProjectIfMissing({
    ownerId: george._id,
    title: "Mobile App for Health Tracking",
    description: "A cross-platform app to track daily health metrics.",
    projectType: "web",
    requiredSkills: [skillBy("React"), skillBy("TypeScript"), skillBy("UI/UX")].filter(Boolean),
    openRoles: ["Mobile Developer", "Designer"],
    teamSizeRequired: 3,
  });

  const p4 = await createProjectIfMissing({
    ownerId: fiona._id,
    title: "DevOps Tooling Dashboard",
    description: "Internal tooling to manage docker deployments and postgres backups.",
    projectType: "web",
    requiredSkills: [skillBy("Docker"), skillBy("Node.js"), skillBy("PostgreSQL"), skillBy("React")].filter(Boolean),
    openRoles: ["DevOps", "Full Stack Developer"],
    teamSizeRequired: 2,
  });

  const p5 = await createProjectIfMissing({
    ownerId: alice._id,
    title: "Open Source CMS Plugin",
    description: "A comprehensive plugin system for headless CMS integrations.",
    projectType: "web",
    requiredSkills: [skillBy("JavaScript"), skillBy("Node.js"), skillBy("TypeScript")].filter(Boolean),
    openRoles: ["Open Source Contributor", "Backend Developer"],
    teamSizeRequired: 3,
  });

  const p6 = await createProjectIfMissing({
    ownerId: diana._id,
    title: "Real-time Analytics Pipeline",
    description: "High-throughput data ingestion and analytics pipeline.",
    projectType: "ml",
    requiredSkills: [skillBy("Python"), skillBy("PostgreSQL"), skillBy("Docker"), skillBy("FastAPI")].filter(Boolean),
    openRoles: ["Data Engineer", "DevOps"],
    teamSizeRequired: 4,
  });

  // Helper functions
  const ensureApplication = async ({ projectId, applicantId, message }) => {
    const existing = await Application.findOne({ projectId, applicantId }).lean();
    if (existing) return existing;
    return await Application.create({
      projectId, applicantId, message, matchScore: 0, status: "pending", isDeleted: false, deletedAt: null
    });
  };

  const ensureTask = async (t, projectId, createdBy) => {
    const existing = await Task.findOne({ projectId, title: t.title, isDeleted: false }).lean();
    if (existing) return existing;
    return await Task.create({
      projectId, title: t.title, description: t.description || "", assignedTo: t.assignedTo || null,
      createdBy, status: t.status || "todo", priority: t.priority || "medium", tags: t.tags || [],
      dueDate: t.dueDate || null, startedAt: t.startedAt || null, completedAt: t.completedAt || null,
      isDeleted: false, deletedAt: null
    });
  };

  const ensureMessage = async ({ projectId, senderId, content, createdAt }) => {
    const existing = await Message.findOne({ projectId, senderId, content, isDeleted: false }).lean();
    if (existing) return existing;
    return await Message.create({
      projectId, senderId, content, messageType: "text", isEdited: false, editedAt: null,
      isDeleted: false, deletedAt: null, createdAt: createdAt || now(), updatedAt: createdAt || now()
    });
  };

  const ensureNotification = async (n) => {
    const existing = await Notification.findOne({ userId: n.userId, title: n.title, message: n.message, actionUrl: n.actionUrl ?? null }).lean();
    if (existing) return existing;
    return await Notification.create({
      userId: n.userId, type: n.type, title: n.title, message: n.message, actionUrl: n.actionUrl ?? null,
      isRead: Boolean(n.isRead), readAt: n.isRead ? now() : null, isDeleted: false, deletedAt: null,
      createdAt: n.createdAt || now(), updatedAt: n.createdAt || now()
    });
  };

  // P1 Team
  await Team.updateOne({ projectId: p1._id, userId: alice._id }, { $setOnInsert: { projectId: p1._id, userId: alice._id, role: "member", status: "active", projectRole: "Frontend Developer", joinedAt: now(), isDeleted: false, deletedAt: null } }, { upsert: true });
  await Team.updateOne({ projectId: p1._id, userId: evan._id }, { $setOnInsert: { projectId: p1._id, userId: evan._id, role: "member", status: "active", projectRole: "Backend Developer", joinedAt: now(), isDeleted: false, deletedAt: null } }, { upsert: true });
  await Project.updateOne({ _id: p1._id }, { $set: { currentTeamSize: await Team.countDocuments({ projectId: p1._id, status: "active", isDeleted: false }) } });

  // P1 Applications
  const a1 = await ensureApplication({ projectId: p1._id, applicantId: charlie._id, message: "I'd love to design the UI for this e-commerce platform!" });
  await Application.updateOne({ _id: a1._id }, { $set: { status: "accepted", reviewedAt: now(), reviewedBy: ian._id } });
  await Team.updateOne({ projectId: p1._id, userId: charlie._id }, { $setOnInsert: { projectId: p1._id, userId: charlie._id, role: "member", status: "active", projectRole: "UI/UX Designer", joinedAt: now(), isDeleted: false, deletedAt: null } }, { upsert: true });
  await Project.updateOne({ _id: p1._id }, { $set: { currentTeamSize: await Team.countDocuments({ projectId: p1._id, status: "active", isDeleted: false }), status: "in-progress" } });

  // P2 Team & Apps
  await Team.updateOne({ projectId: p2._id, userId: diana._id }, { $setOnInsert: { projectId: p2._id, userId: diana._id, role: "member", status: "active", projectRole: "Backend Engineer", joinedAt: now(), isDeleted: false, deletedAt: null } }, { upsert: true });
  await Project.updateOne({ _id: p2._id }, { $set: { currentTeamSize: await Team.countDocuments({ projectId: p2._id, status: "active", isDeleted: false }) } });
  const a2 = await ensureApplication({ projectId: p2._id, applicantId: hannah._id, message: "I have experience with NLP and would love to join." });
  
  // P3 Team & Apps
  await Team.updateOne({ projectId: p3._id, userId: julia._id }, { $setOnInsert: { projectId: p3._id, userId: julia._id, role: "member", status: "active", projectRole: "Designer", joinedAt: now(), isDeleted: false, deletedAt: null } }, { upsert: true });
  await Project.updateOne({ _id: p3._id }, { $set: { currentTeamSize: await Team.countDocuments({ projectId: p3._id, status: "active", isDeleted: false }) } });
  const a3 = await ensureApplication({ projectId: p3._id, applicantId: charlie._id, message: "I am a UI/UX Designer looking for health tracking app projects." });

  // Tasks for P1
  await ensureTask({ title: "Design homepage mockups", assignedTo: charlie._id, status: "done", priority: "high", tags: [DEMO_TAG, "design"] }, p1._id, ian._id);
  await ensureTask({ title: "Setup React Router", assignedTo: alice._id, status: "in-progress", priority: "medium", tags: [DEMO_TAG, "frontend"] }, p1._id, ian._id);
  await ensureTask({ title: "Create User Schema", assignedTo: evan._id, status: "todo", priority: "high", tags: [DEMO_TAG, "backend"] }, p1._id, ian._id);

  // Update P1 Metrics
  const totalTasks = await Task.countDocuments({ projectId: p1._id, isDeleted: false });
  const completedTasks = await Task.countDocuments({ projectId: p1._id, isDeleted: false, status: "done" });
  await Project.updateOne({ _id: p1._id }, { $set: { "metrics.totalTasks": totalTasks, "metrics.completedTasks": completedTasks, "metrics.completionPercentage": totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0 } });

  // Messages for P1
  const base = Date.now() - 1000 * 60 * 60 * 2;
  await ensureMessage({ projectId: p1._id, senderId: ian._id, content: "Welcome everyone to the new E-Commerce project!", createdAt: new Date(base) });
  await ensureMessage({ projectId: p1._id, senderId: alice._id, content: "Thanks Ian! I'll start on the frontend routing today.", createdAt: new Date(base + 1000 * 60 * 5) });
  await ensureMessage({ projectId: p1._id, senderId: charlie._id, content: "I just finished the mockups for the homepage.", createdAt: new Date(base + 1000 * 60 * 15) });

  // Notifications
  await ensureNotification({ userId: ian._id, type: "application_received", title: "New Application Received", message: "Charlie Davis applied to E-Commerce Platform Redesign", actionUrl: `/projects/${p1._id}/applications`, isRead: true });
  await ensureNotification({ userId: charlie._id, type: "application_accepted", title: "Application Accepted", message: "You have been accepted to E-Commerce Platform Redesign", actionUrl: `/projects/${p1._id}`, isRead: false });
  await ensureNotification({ userId: alice._id, type: "task_assigned", title: "Task Assigned", message: "Setup React Router assigned to you", actionUrl: `/projects/${p1._id}/workspace`, isRead: false });

  console.log("✅ Demo data seeded");
  console.log("\nLogins (Password: password123):");
  console.log("- alice@example.com (Full Stack Developer)");
  console.log("- bob@example.com (Data Scientist)");
  console.log("- charlie@example.com (UI/UX Designer)");
  console.log("- diana@example.com (Backend Engineer)");
  console.log("- evan@example.com (Frontend Developer)");
  console.log("- fiona@example.com (DevOps Engineer)");
  console.log("- george@example.com (Mobile Developer)");
  console.log("- hannah@example.com (ML Engineer)");
  console.log("- ian@example.com (System Architect)");
  console.log("- julia@example.com (Product Manager)");
  console.log("\nDemo Projects:");
  console.log(`- ${p1.title} (${p1._id})`);
  console.log(`- ${p2.title} (${p2._id})`);
  console.log(`- ${p3.title} (${p3._id})`);
  console.log(`- ${p4.title} (${p4._id})`);
  console.log(`- ${p5.title} (${p5._id})`);
  console.log(`- ${p6.title} (${p6._id})`);

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
