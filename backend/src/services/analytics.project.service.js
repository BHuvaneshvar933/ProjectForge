import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Message from "../models/message.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";
import {
  parseDays,
  startOfDayUtc,
  addDaysUtc,
  dailySeries,
  ensureProjectMemberOrOwner,
} from "./analytics.helpers.js";

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
