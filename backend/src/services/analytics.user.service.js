import mongoose from "mongoose";
import Message from "../models/message.model.js";
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";
import { ensureProjectMemberOrOwner } from "./analytics.helpers.js";

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
