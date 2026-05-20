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

// Seed strategy:
// - Everything created by this script is tagged with a deterministic "demo" signature
//   so we can reset safely without touching real user data.
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
    {
      name: "Demo Owner",
      email: "owner@demo.com",
      password: "password123",
      bio: "Owns demo projects.",
      skills: [byName("React"), byName("Node.js"), byName("MongoDB"), byName("Express")].filter(Boolean),
    },
    {
      name: "Demo Member",
      email: "member@demo.com",
      password: "password123",
      bio: "Joined one project; has tasks + chat history.",
      skills: [byName("JavaScript"), byName("React"), byName("UI/UX"), byName("Figma")].filter(Boolean),
    },
    {
      name: "Demo Applicant",
      email: "applicant@demo.com",
      password: "password123",
      bio: "Applied to a couple projects to drive notifications.",
      skills: [byName("Python"), byName("ML"), byName("NLP"), byName("Docker")].filter(Boolean),
    },
    {
      name: "Demo Explorer",
      email: "explorer@demo.com",
      password: "password123",
      bio: "Used to see recommendations (has overlapping skills).",
      skills: [byName("TypeScript"), byName("React"), byName("Node.js"), byName("Socket.io")].filter(Boolean),
    },
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

  const owner = users["owner@demo.com"];
  const member = users["member@demo.com"];
  const applicant = users["applicant@demo.com"];
  const explorer = users["explorer@demo.com"];

  const skillBy = (name) => skills.find((s) => s.name === name)?._id;

  // Projects (public + recruiting) for browsing + recommendations.
  const p1 = await createProjectIfMissing({
    ownerId: owner._id,
    title: "Demo: Team Chat Workspace",
    description: "A demo project with tasks + realtime chat. Used to test Workspace UI.",
    projectType: "web",
    requiredSkills: [skillBy("React"), skillBy("Node.js"), skillBy("Socket.io"), skillBy("MongoDB")].filter(Boolean),
    openRoles: ["UI/UX", "Backend Developer"],
    teamSizeRequired: 3,
  });

  const p2 = await createProjectIfMissing({
    ownerId: owner._id,
    title: "Demo: ML Project Matcher",
    description: "Used to validate Jaccard recommendations and match % on cards.",
    projectType: "ml",
    requiredSkills: [skillBy("Python"), skillBy("ML"), skillBy("NLP"), skillBy("Docker")].filter(Boolean),
    openRoles: ["ML Engineer", "Research"],
    teamSizeRequired: 4,
  });

  const p3 = await createProjectIfMissing({
    ownerId: owner._id,
    title: "Demo: TypeScript UI Kit",
    description: "Web project with strong TS/React overlap for recommendations.",
    projectType: "web",
    requiredSkills: [skillBy("TypeScript"), skillBy("React"), skillBy("Express")].filter(Boolean),
    openRoles: ["Frontend Developer"],
    teamSizeRequired: 2,
  });

  // Team membership: member joins p1
  await Team.updateOne(
    { projectId: p1._id, userId: member._id },
    {
      $setOnInsert: {
        projectId: p1._id,
        userId: member._id,
        role: "member",
        status: "active",
        projectRole: "UI/UX",
        joinedAt: now(),
        isDeleted: false,
        deletedAt: null,
      },
    },
    { upsert: true }
  );

  // Keep project currentTeamSize consistent for seeded membership.
  const p1TeamCount = await Team.countDocuments({ projectId: p1._id, status: "active", isDeleted: false });
  await Project.updateOne({ _id: p1._id }, { $set: { currentTeamSize: p1TeamCount } });

  // Applications:
  // - applicant applies to p1 and gets accepted (creates notifications)
  // - applicant applies to p3 and gets rejected (creates notifications)
  // - explorer applies to p2 (left pending)
  const ensureApplication = async ({ projectId, applicantId, message }) => {
    const existing = await Application.findOne({ projectId, applicantId }).lean();
    if (existing) return existing;
    return await Application.create({
      projectId,
      applicantId,
      message,
      matchScore: 0,
      status: "pending",
      isDeleted: false,
      deletedAt: null,
    });
  };

  const a1 = await ensureApplication({
    projectId: p1._id,
    applicantId: applicant._id,
    message: "Demo application: I can help with UI/UX and delivery.",
  });
  const a2 = await ensureApplication({
    projectId: p3._id,
    applicantId: applicant._id,
    message: "Demo application: TS/React contributor.",
  });
  await ensureApplication({
    projectId: p2._id,
    applicantId: explorer._id,
    message: "Demo application: interested in ML infra and evaluation.",
  });

  // Mark a1 accepted, ensure team membership + project status/team size.
  await Application.updateOne(
    { _id: a1._id },
    {
      $set: {
        status: "accepted",
        reviewedAt: now(),
        reviewedBy: owner._id,
      },
    }
  );

  await Team.updateOne(
    { projectId: p1._id, userId: applicant._id },
    {
      $setOnInsert: {
        projectId: p1._id,
        userId: applicant._id,
        role: "member",
        status: "active",
        projectRole: "Backend Developer",
        joinedAt: now(),
        isDeleted: false,
        deletedAt: null,
      },
    },
    { upsert: true }
  );

  const p1TeamCount2 = await Team.countDocuments({ projectId: p1._id, status: "active", isDeleted: false });
  await Project.updateOne(
    { _id: p1._id },
    {
      $set: {
        currentTeamSize: p1TeamCount2,
        status: p1TeamCount2 >= (await Project.findById(p1._id).lean()).teamSizeRequired ? "in-progress" : "recruiting",
      },
    }
  );

  // Mark a2 rejected
  await Application.updateOne(
    { _id: a2._id },
    {
      $set: {
        status: "rejected",
        rejectionReason: "Demo rejection: role filled",
        reviewedAt: now(),
        reviewedBy: owner._id,
      },
    }
  );

  // Tasks for p1
  const ensureTask = async (t) => {
    const existing = await Task.findOne({ projectId: p1._id, title: t.title, isDeleted: false }).lean();
    if (existing) return existing;
    return await Task.create({
      projectId: p1._id,
      title: t.title,
      description: t.description || "",
      assignedTo: t.assignedTo || null,
      createdBy: owner._id,
      status: t.status || "todo",
      priority: t.priority || "medium",
      tags: t.tags || [],
      dueDate: t.dueDate || null,
      startedAt: t.startedAt || null,
      completedAt: t.completedAt || null,
      isDeleted: false,
      deletedAt: null,
    });
  };

  const tasks = [
    {
      title: "Demo: Setup project structure",
      description: "Initialize frontend + backend basics.",
      assignedTo: member._id,
      status: "done",
      priority: "high",
      tags: [DEMO_TAG, "setup"],
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      title: "Demo: Implement chat typing indicator",
      description: "Wire typing/stop-typing events.",
      assignedTo: applicant._id,
      status: "in-progress",
      priority: "medium",
      tags: [DEMO_TAG, "realtime"],
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },
    {
      title: "Demo: Polish notifications dropdown",
      description: "Add mark-all-read + actionUrl navigation.",
      assignedTo: owner._id,
      status: "todo",
      priority: "low",
      tags: [DEMO_TAG, "ux"],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
  ];

  const createdTasks = [];
  for (const t of tasks) createdTasks.push(await ensureTask(t));

  // Update project metrics for seeded tasks
  const totalTasks = await Task.countDocuments({ projectId: p1._id, isDeleted: false });
  const completedTasks = await Task.countDocuments({ projectId: p1._id, isDeleted: false, status: "done" });
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  await Project.updateOne(
    { _id: p1._id },
    {
      $set: {
        "metrics.totalTasks": totalTasks,
        "metrics.completedTasks": completedTasks,
        "metrics.completionPercentage": completionPercentage,
      },
    }
  );

  // Chat messages for p1
  const ensureMessage = async ({ senderId, content, createdAt }) => {
    const existing = await Message.findOne({ projectId: p1._id, senderId, content, isDeleted: false }).lean();
    if (existing) return existing;
    return await Message.create({
      projectId: p1._id,
      senderId,
      content,
      messageType: "text",
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: createdAt || now(),
      updatedAt: createdAt || now(),
    });
  };

  const base = Date.now() - 1000 * 60 * 60 * 2;
  await ensureMessage({ senderId: owner._id, content: "Demo: Welcome to the workspace chat.", createdAt: new Date(base) });
  await ensureMessage({ senderId: member._id, content: "Demo: I will handle UI tasks.", createdAt: new Date(base + 1000 * 60 * 3) });
  await ensureMessage({ senderId: applicant._id, content: "Demo: I can pick up backend work too.", createdAt: new Date(base + 1000 * 60 * 6) });

  // Notifications:
  // - owner gets application_received
  // - applicant gets accepted/rejected
  // - add a couple extra demo notifications
  const ensureNotification = async (n) => {
    const existing = await Notification.findOne({
      userId: n.userId,
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl ?? null,
    }).lean();
    if (existing) return existing;
    return await Notification.create({
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl ?? null,
      isRead: Boolean(n.isRead),
      readAt: n.isRead ? now() : null,
      isDeleted: false,
      deletedAt: null,
      createdAt: n.createdAt || now(),
      updatedAt: n.createdAt || now(),
    });
  };

  await ensureNotification({
    userId: owner._id,
    type: "application_received",
    title: "Demo: New Application Received",
    message: "Demo Applicant applied to Demo: Team Chat Workspace",
    actionUrl: `/projects/${p1._id}/applications`,
    isRead: false,
  });

  await ensureNotification({
    userId: applicant._id,
    type: "application_accepted",
    title: "Demo: Application Accepted",
    message: "You have been accepted to Demo: Team Chat Workspace",
    actionUrl: `/projects/${p1._id}`,
    isRead: false,
  });

  await ensureNotification({
    userId: applicant._id,
    type: "application_rejected",
    title: "Demo: Application Rejected",
    message: "Demo rejection: role filled",
    actionUrl: "/applications/sent",
    isRead: true,
  });

  await ensureNotification({
    userId: member._id,
    type: "task_assigned",
    title: "Demo: Task Assigned",
    message: "Demo task assigned to you",
    actionUrl: `/projects/${p1._id}/workspace`,
    isRead: false,
  });

  console.log("✅ Demo data seeded");
  console.log("\nLogins:");
  console.log("- owner@demo.com / password123");
  console.log("- member@demo.com / password123");
  console.log("- applicant@demo.com / password123");
  console.log("- explorer@demo.com / password123");
  console.log("\nDemo Projects:");
  console.log(`- ${p1.title} (${p1._id})`);
  console.log(`- ${p2.title} (${p2._id})`);
  console.log(`- ${p3.title} (${p3._id})`);

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
