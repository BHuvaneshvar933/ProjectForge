import Application from "../models/application.model.js";
import Message from "../models/message.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { parseDays, startOfDayUtc, addDaysUtc, dailySeries } from "./analytics.helpers.js";

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
