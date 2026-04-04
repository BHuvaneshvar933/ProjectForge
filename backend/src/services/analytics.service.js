import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Message from "../models/message.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";

const startOfDayUtc = (d) => {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
};

const addDaysUtc = (d, days) => {
  const dt = new Date(d);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
};

const parseDays = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(90, n));
};

const dailySeries = async ({ model, from, to, extraMatch = {} }) => {
  const rows = await model
    .aggregate([
      {
        $match: {
          ...extraMatch,
          createdAt: { $gte: from, $lt: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .exec();

  const map = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];

  for (let cur = new Date(from); cur < to; cur = addDaysUtc(cur, 1)) {
    const key = cur.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) || 0 });
  }

  return out;
};

const ensureProjectMemberOrOwner = async ({ projectId, requesterId }) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .select("owner")
    .lean();

  if (!project) {
    throw new Error("Project not found");
  }

  const isOwner = project.owner?.toString() === requesterId?.toString();
  if (isOwner) return { project, isOwner: true };

  const membership = await Team.findOne({
    projectId,
    userId: requesterId,
    status: "active",
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (!membership) {
    throw new Error("Not authorized");
  }

  return { project, isOwner: false };
};

export const getOverview = async (query) => {
  const days = parseDays(query?.days, 7);
  const to = startOfDayUtc(new Date());
  const from = addDaysUtc(to, -days);

  const [
    totalUsers,
    activeUsers,
    totalProjects,
    publicProjects,
    byProjectStatus,
    totalApplications,
    pendingApplications,
    byApplicationStatus,
    totalTasks,
    byTaskStatus,
    totalMessages,
    projectsCreated,
    applicationsCreated,
    messagesSent,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true, deletedAt: null }),
    Project.countDocuments({ isDeleted: false }),
    Project.countDocuments({ isDeleted: false, visibility: "public" }),
    Project.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ isDeleted: false }),
    Application.countDocuments({ isDeleted: false, status: "pending" }),
    Application.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ isDeleted: false }),
    Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Message.countDocuments({ isDeleted: false }),
    dailySeries({ model: Project, from, to, extraMatch: { isDeleted: false } }),
    dailySeries({
      model: Application,
      from,
      to,
      extraMatch: { isDeleted: false },
    }),
    dailySeries({ model: Message, from, to, extraMatch: { isDeleted: false } }),
  ]);

  const toStatusObject = (rows, defaults = {}) => {
    const obj = { ...defaults };
    for (const r of rows || []) {
      if (r?._id) obj[r._id] = r.count;
    }
    return obj;
  };

  return {
    totals: {
      users: totalUsers,
      activeUsers,
      projects: totalProjects,
      publicProjects,
      applications: totalApplications,
      pendingApplications,
      tasks: totalTasks,
      messages: totalMessages,
    },
    byStatus: {
      projects: toStatusObject(byProjectStatus, {
        recruiting: 0,
        "in-progress": 0,
        completed: 0,
        archived: 0,
      }),
      applications: toStatusObject(byApplicationStatus, {
        pending: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      }),
      tasks: toStatusObject(byTaskStatus, {
        todo: 0,
        "in-progress": 0,
        done: 0,
      }),
    },
    lastNDays: {
      days,
      from: from.toISOString(),
      to: to.toISOString(),
      projectsCreated,
      applicationsCreated,
      messagesSent,
    },
  };
};

export const getProjectSummary = async ({ projectId, requesterId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await Project.findOne({ _id: projectId, isDeleted: false })
    .select(
      "title status projectType viewCount createdAt metrics currentTeamSize teamSizeRequired owner openRoles"
    )
    .lean();

  if (!project) {
    throw new Error("Project not found");
  }

  const requesterTeam = await Team.findOne({
    projectId,
    userId: requesterId,
    status: "active",
    isDeleted: false,
  })
    .select("role")
    .lean();

  const isOwner = project.owner?.toString() === requesterId?.toString();
  const isMember = Boolean(requesterTeam) || isOwner;

  if (!isMember) {
    throw new Error("Not authorized");
  }

  const [teamActiveCount, tasksByStatus, totalMessages] = await Promise.all([
    Team.countDocuments({
      projectId,
      status: "active",
      isDeleted: false,
    }),
    Task.aggregate([
      { $match: { projectId: project._id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Message.countDocuments({ projectId: project._id, isDeleted: false }),
  ]);

  const tasks = { todo: 0, "in-progress": 0, done: 0 };
  for (const r of tasksByStatus) {
    if (r?._id) tasks[r._id] = r.count;
  }

  const result = {
    project: {
      _id: project._id,
      title: project.title,
      status: project.status,
      projectType: project.projectType,
      viewCount: project.viewCount || 0,
      createdAt: project.createdAt,
      metrics: project.metrics || null,
      currentTeamSize: project.currentTeamSize,
      teamSizeRequired: project.teamSizeRequired,
      openRolesCount: Array.isArray(project.openRoles) ? project.openRoles.length : 0,
    },
    team: {
      activeCount: teamActiveCount,
    },
    tasks: {
      total: tasks.todo + tasks["in-progress"] + tasks.done,
      byStatus: tasks,
    },
    messages: {
      total: totalMessages,
    },
    applications: null,
  };

  if (isOwner) {
    const appsByStatus = await Application.aggregate([
      { $match: { projectId: project._id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const apps = { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    for (const r of appsByStatus) {
      if (r?._id) apps[r._id] = r.count;
    }

    result.applications = {
      total: apps.pending + apps.accepted + apps.rejected + apps.withdrawn,
      byStatus: apps,
    };
  }

  return result;
};

export const getProjectAnalytics = async ({ projectId, requesterId, days }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const daysWindow = parseDays(days, 14);
  const to = startOfDayUtc(new Date());
  const from = addDaysUtc(to, -daysWindow);

  const { project } = await ensureProjectMemberOrOwner({ projectId, requesterId });

  const [
    teamCount,
    tasksByStatus,
    assignedToAgg,
    completedPerDay,
    createdPerDay,
    avgCompletionAgg,
    overdueCount,
  ] = await Promise.all([
    Team.countDocuments({ projectId, status: "active", isDeleted: false }),
    Task.aggregate([
      { $match: { projectId: project._id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      {
        $match: {
          projectId: project._id,
          isDeleted: false,
          assignedTo: { $ne: null },
        },
      },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      {
        $match: {
          projectId: project._id,
          isDeleted: false,
          status: "done",
          completedAt: { $gte: from, $lt: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$completedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    dailySeries({ model: Task, from, to, extraMatch: { projectId: project._id, isDeleted: false } }),
    Task.aggregate([
      {
        $match: {
          projectId: project._id,
          isDeleted: false,
          status: "done",
          completedAt: { $ne: null },
        },
      },
      {
        $project: {
          durationMs: { $subtract: ["$completedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: "$durationMs" },
        },
      },
    ]),
    Task.countDocuments({
      projectId: project._id,
      isDeleted: false,
      status: { $ne: "done" },
      dueDate: { $ne: null, $lt: new Date() },
    }),
  ]);

  const tasks = { total: 0, completed: 0, inProgress: 0, todo: 0 };
  for (const r of tasksByStatus || []) {
    if (r?._id === "done") tasks.completed = r.count;
    if (r?._id === "in-progress") tasks.inProgress = r.count;
    if (r?._id === "todo") tasks.todo = r.count;
  }
  tasks.total = tasks.completed + tasks.inProgress + tasks.todo;

  const completionRate = tasks.total === 0 ? 0 : Math.round((tasks.completed / tasks.total) * 100);

  const assignedUserIds = new Set(
    (assignedToAgg || [])
      .map((r) => (r?._id ? String(r._id) : null))
      .filter(Boolean)
  );

  const activeMembers = assignedUserIds.size;

  const completedMap = new Map((completedPerDay || []).map((r) => [r._id, r.count]));
  const completedSeries = [];
  for (let cur = new Date(from); cur < to; cur = addDaysUtc(cur, 1)) {
    const key = cur.toISOString().slice(0, 10);
    completedSeries.push({ date: key, count: completedMap.get(key) || 0 });
  }

  const totalCompletedInWindow = completedSeries.reduce((sum, d) => sum + d.count, 0);
  const velocity = daysWindow === 0 ? 0 : Number((totalCompletedInWindow / daysWindow).toFixed(2));

  const avgMs = avgCompletionAgg?.[0]?.avgMs;
  const avgTaskCompletionTimeHours = avgMs ? Number((avgMs / (1000 * 60 * 60)).toFixed(2)) : null;

  return {
    projectId,
    team: {
      teamSize: teamCount,
      activeMembers,
    },
    tasks: {
      totalTasks: tasks.total,
      completedTasks: tasks.completed,
      inProgressTasks: tasks.inProgress,
      todoTasks: tasks.todo,
      completionRate,
      velocity,
      avgTaskCompletionTimeHours,
      overdueTasks: overdueCount,
    },
    activity: {
      days: daysWindow,
      from: from.toISOString(),
      to: to.toISOString(),
      tasksCreatedPerDay: createdPerDay,
      tasksCompletedPerDay: completedSeries,
    },
  };
};

export const getProjectActivity = async ({ projectId, requesterId, days }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const daysWindow = parseDays(days, 30);
  const to = startOfDayUtc(new Date());
  const from = addDaysUtc(to, -daysWindow);

  await ensureProjectMemberOrOwner({ projectId, requesterId });

  const [tasksCreated, tasksCompleted] = await Promise.all([
    dailySeries({ model: Task, from, to, extraMatch: { projectId: new mongoose.Types.ObjectId(projectId), isDeleted: false } }),
    (async () => {
      const rows = await Task.aggregate([
        {
          $match: {
            projectId: new mongoose.Types.ObjectId(projectId),
            isDeleted: false,
            status: "done",
            completedAt: { $gte: from, $lt: to },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$completedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const map = new Map(rows.map((r) => [r._id, r.count]));
      const out = [];
      for (let cur = new Date(from); cur < to; cur = addDaysUtc(cur, 1)) {
        const key = cur.toISOString().slice(0, 10);
        out.push({ date: key, count: map.get(key) || 0 });
      }
      return out;
    })(),
  ]);

  return {
    projectId,
    days: daysWindow,
    from: from.toISOString(),
    to: to.toISOString(),
    tasksCreatedPerDay: tasksCreated,
    tasksCompletedPerDay: tasksCompleted,
  };
};

export const getProjectMessageAnalytics = async ({ projectId, requesterId, days }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const daysWindow = parseDays(days, 30);
  const to = startOfDayUtc(new Date());
  const from = addDaysUtc(to, -daysWindow);

  await ensureProjectMemberOrOwner({ projectId, requesterId });

  const pid = new mongoose.Types.ObjectId(projectId);

  const [totalMessages, perUser, perDay] = await Promise.all([
    Message.countDocuments({ projectId: pid, isDeleted: false }),
    Message.aggregate([
      { $match: { projectId: pid, isDeleted: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          count: 1,
          name: "$user.name",
          email: "$user.email",
          avatar: "$user.avatar",
        },
      },
    ]),
    dailySeries({
      model: Message,
      from,
      to,
      extraMatch: { projectId: pid, isDeleted: false },
    }),
  ]);

  return {
    projectId,
    totals: {
      messages: totalMessages,
    },
    topSenders: perUser,
    lastNDays: {
      days: daysWindow,
      from: from.toISOString(),
      to: to.toISOString(),
      messagesPerDay: perDay,
    },
  };
};

export const getUserAnalytics = async ({ userId, requesterId }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  // Privacy-safe default: users can only view their own analytics.
  if (userId.toString() !== requesterId.toString()) {
    throw new Error("Not authorized");
  }

  const uid = new mongoose.Types.ObjectId(userId);

  const [assignedTotal, byStatus, messagesTotal] = await Promise.all([
    Task.countDocuments({ assignedTo: uid, isDeleted: false }),
    Task.aggregate([
      { $match: { assignedTo: uid, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Message.countDocuments({ senderId: uid, isDeleted: false }),
  ]);

  const tasks = { todo: 0, "in-progress": 0, done: 0 };
  for (const r of byStatus || []) {
    if (r?._id) tasks[r._id] = r.count;
  }

  const tasksAssigned = assignedTotal;
  const tasksCompleted = tasks.done;
  const tasksInProgress = tasks["in-progress"];
  const completionRate = tasksAssigned === 0 ? 0 : Number((tasksCompleted / tasksAssigned).toFixed(2));
  const productivityScore = tasksAssigned === 0
    ? 0
    : Number(((tasksCompleted * 2 + tasksInProgress) / tasksAssigned).toFixed(2));

  return {
    userId,
    tasks: {
      tasksAssigned,
      tasksCompleted,
      tasksInProgress,
      tasksTodo: tasks.todo,
      completionRate,
      productivityScore,
    },
    messages: {
      totalMessagesSent: messagesTotal,
    },
  };
};

export const getUserProjectAnalytics = async ({ userId, projectId, requesterId }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const { project, isOwner } = await ensureProjectMemberOrOwner({
    projectId,
    requesterId,
  });

  // By default: user can see their own per-project analytics; owner can see any member.
  if (!isOwner && userId.toString() !== requesterId.toString()) {
    throw new Error("Not authorized");
  }

  // Target user must be an active member (or the owner).
  const targetIsOwner = project.owner?.toString() === userId.toString();
  if (!targetIsOwner) {
    const targetMembership = await Team.findOne({
      projectId,
      userId,
      status: "active",
      isDeleted: false,
    })
      .select("_id")
      .lean();

    if (!targetMembership) {
      throw new Error("User is not an active member of this project");
    }
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const pid = new mongoose.Types.ObjectId(projectId);

  const [assignedTotal, byStatus, avgCompletionAgg, overdueTasks, messagesSent] =
    await Promise.all([
      Task.countDocuments({ projectId: pid, assignedTo: uid, isDeleted: false }),
      Task.aggregate([
        { $match: { projectId: pid, assignedTo: uid, isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        {
          $match: {
            projectId: pid,
            assignedTo: uid,
            isDeleted: false,
            status: "done",
            completedAt: { $ne: null },
          },
        },
        {
          $project: {
            durationMs: { $subtract: ["$completedAt", "$createdAt"] },
          },
        },
        { $group: { _id: null, avgMs: { $avg: "$durationMs" } } },
      ]),
      Task.countDocuments({
        projectId: pid,
        assignedTo: uid,
        isDeleted: false,
        status: { $ne: "done" },
        dueDate: { $ne: null, $lt: new Date() },
      }),
      Message.countDocuments({ projectId: pid, senderId: uid, isDeleted: false }),
    ]);

  const tasks = { todo: 0, "in-progress": 0, done: 0 };
  for (const r of byStatus || []) {
    if (r?._id) tasks[r._id] = r.count;
  }

  const tasksAssigned = assignedTotal;
  const tasksCompleted = tasks.done;
  const tasksInProgress = tasks["in-progress"];
  const tasksTodo = tasks.todo;

  const completionRate =
    tasksAssigned === 0
      ? "0.00"
      : ((tasksCompleted / tasksAssigned) * 100).toFixed(2);

  const productivityScore =
    tasksAssigned === 0
      ? "0.00"
      : ((tasksCompleted * 2 + tasksInProgress) / tasksAssigned).toFixed(2);

  const avgMs = avgCompletionAgg?.[0]?.avgMs;
  const avgTaskCompletionTimeHours = avgMs
    ? Number((avgMs / (1000 * 60 * 60)).toFixed(2))
    : null;

  return {
    projectId,
    userId,
    analytics: {
      tasksAssigned,
      tasksCompleted,
      tasksInProgress,
      tasksTodo,
      completionRate,
      productivityScore,
      avgTaskCompletionTimeHours,
      overdueTasks,
      messagesSent,
    },
  };
};

export const trackProjectView = async (projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await Project.findOneAndUpdate(
    { _id: projectId, isDeleted: false },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).select("_id viewCount");

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
};
