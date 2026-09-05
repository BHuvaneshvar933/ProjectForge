import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import {
  handleTaskMarkedDone,
  handleTaskReopened,
} from "./metrics.service.js";

export const createTask = async (projectId, payload, currentUser) => {
  // Let's make sure the project exists and the user is actually allowed to add a task.

  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "completed") {
    throw new Error("Project is completed");
  }
  if (!project.metrics) {
  project.metrics = {
    totalTasks: 0,
    completedTasks: 0,
    totalHoursLogged: 0,
    velocityScore: 0,
    completionPercentage: 0,
  };
}

  const teamMember = await Team.findOne({
    projectId,
    userId: currentUser._id,
    status: "active",
    isDeleted: false,
  });

  if (!teamMember) {
    throw new Error("You are not a member of this project");
  }

  if (!payload.title || payload.title.trim() === "") {
    throw new Error("Task title is required");
  }

  // If someone is being assigned right away, double-check they're on the team!
  if (payload.assignedTo) {
    const assignee = await Team.findOne({
      projectId,
      userId: payload.assignedTo,
      status: "active",
      isDeleted: false,
    });

    if (!assignee) {
      throw new Error("Assigned user is not an active team member");
    }
  }

  // We use a transaction here so that if anything fails, we don't end up with half-created data.

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const nextTaskNumber = (project.lastTaskNumber || 0) + 1;
    project.lastTaskNumber = nextTaskNumber;

    const newTask = await Task.create(
      [
        {
          projectId,
          title: payload.title.trim(),
          description: payload.description || "",
          assignedTo: payload.assignedTo || null,
          createdBy: currentUser._id,
          priority: payload.priority || "medium",
          tags: payload.tags || [],
          startedAt: payload.startedAt || null,
          dueDate: payload.dueDate || null,
          taskNumber: nextTaskNumber,
          issueType: payload.issueType || "task",
          parentId: payload.parentId || null,
          releaseId: payload.releaseId || null,
          attachmentUrl: payload.attachmentUrl || null,
          attachmentName: payload.attachmentName || null,
        },
      ],
      { session }
    );

    // Bump the project's total task count
    project.metrics.totalTasks += 1;

    project.metrics.completionPercentage =
      project.metrics.totalTasks === 0
        ? 0
        : (project.metrics.completedTasks /
            project.metrics.totalTasks) *
          100;

    await project.save({ session });

    await session.commitTransaction();
    session.endSession();

    return newTask[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


export const getProjectTasks = async (projectId, query, currentUser) => {
  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  const teamMember = await Team.findOne({
    projectId,
    userId: currentUser._id,
    status: "active",
    isDeleted: false,
  });

  if (!teamMember) {
    throw new Error("You are not a member of this project");
  }

  const filter = {
    projectId,
    isDeleted: false,
  };

  if (query.status) filter.status = query.status;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.priority) filter.priority = query.priority;

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Task.countDocuments(filter);

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("assignedTo", "name avatar")
    .populate("createdBy", "name");

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const assignTask = async (taskId, payload, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new Error("Task not found");
  }

  if (payload.__v !== undefined && task.__v !== payload.__v) {
    const err = new Error("This task was updated by another team member.");
    err.name = "VersionError";
    throw err;
  }

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "completed") {
    throw new Error("Cannot modify tasks of completed project");
  }

  const teamMember = await Team.findOne({
    projectId: task.projectId,
    userId: currentUser._id,
    status: "active",
    isDeleted: false,
  });

  if (!teamMember) {
    throw new Error("You are not a member of this project");
  }

  // Only assign them if they're actively on the project.
  if (payload.assignedTo) {
    const assignee = await Team.findOne({
      projectId: task.projectId,
      userId: payload.assignedTo,
      status: "active",
      isDeleted: false,
    });

    if (!assignee) {
      throw new Error("Assigned user is not an active team member");
    }

    task.assignedTo = payload.assignedTo;
  } else {
    task.assignedTo = null;
  }

  await task.save();

  return task;
};

export async function updateTaskStatus(taskId, newStatus, userId, clientVersion) {
  const validStatuses = ["todo", "in-progress", "done"];

  if (!validStatuses.includes(newStatus)) {
    throw new Error("Invalid status value");
  }

  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new Error("Task not found");
  }

  if (clientVersion !== undefined && task.__v !== clientVersion) {
    const err = new Error("This task was updated by another team member.");
    err.name = "VersionError";
    throw err;
  }

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "completed") {
    throw new Error("Project is completed");
  }

  const isMember = await Team.findOne({
    projectId: project._id,
    userId,
    status: "active",
  });

  if (!isMember) {
    throw new Error("Not authorized");
  }

  const oldStatus = task.status;

  if (oldStatus === newStatus) {
    return task;
  }

  // It doesn't make sense to finish a task that nobody is working on!
  if (newStatus === "done" && !task.assignedTo) {
    throw new Error("Task must be assigned before marking as done");
  }

  // Easy status swap, no need to touch the completion metrics yet.
  if (
    (oldStatus !== "done" && newStatus !== "done")
  ) {
    task.status = newStatus;

    if (newStatus === "in-progress" && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (newStatus !== "done") {
      task.completedAt = null;
    }

    await task.save();
    return task;
  }

  // If a task is being marked 'done' or 'reopened', we need to carefully update the project metrics in a transaction.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    task.status = newStatus;

    if (newStatus === "done") {
      task.completedAt = new Date();
      await task.save({ session });

      await handleTaskMarkedDone({ task, project, session });
      
      const user = await import("../models/user.model.js").then(m => m.default).then(User => User.findById(userId).select("name").session(session));
      const userName = user ? user.name : "A team member";

      if (!project.archiveData) {
        project.archiveData = { timelineEvents: [], challenges: [], lessonsLearned: [], deliverables: {} };
      }
      const taskRef = project.key ? `${project.key}-${task.taskNumber}` : `task #${task.taskNumber}`;
      project.archiveData.timelineEvents.push({
        eventType: "task",
        title: `Completed: ${task.title}`,
        description: `${userName} completed ${taskRef}.`,
        date: new Date()
      });
      await project.save({ session });
    } else if (oldStatus === "done" && newStatus !== "done") {
      task.completedAt = null;
      await task.save({ session });

      await handleTaskReopened({ task, project, session });
    }

    if (newStatus === "in-progress" && !task.startedAt) {
      task.startedAt = new Date();
      await task.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return task;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new Error("Task not found");
  }

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "completed") {
    throw new Error("Project is completed");
  }

  const member = await Team.findOne({
    projectId: project._id,
    userId,
    status: "active",
  });

  if (!member) {
    throw new Error("Not authorized");
  }

  task.isDeleted = true;
  task.deletedAt = new Date();

  await task.save();

  return task;
};

export const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new Error("Task not found");
  }

  if (updateData.__v !== undefined && task.__v !== updateData.__v) {
    const err = new Error("This task was updated by another team member.");
    err.name = "VersionError";
    throw err;
  }

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "completed") {
    throw new Error("Project is completed");
  }

  const member = await Team.findOne({
    projectId: project._id,
    userId,
    status: "active",
  });

  if (!member) {
    throw new Error("Not authorized");
  }

  const allowedFields = [
    "title",
    "description",
    "priority",
    "dueDate",
    "startedAt",
    "tags",
    "issueType",
    "parentId",
    "releaseId",
    "attachmentUrl",
    "attachmentName",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      task[field] = updateData[field];
    }
  });

  await task.save();

  return task;
};

export async function bulkUpdateTasks(projectId, userId, action, taskIds, payload) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw new Error("No tasks specified");
  }

  const project = await Project.findById(projectId);
  if (!project || project.isDeleted) throw new Error("Project not found");

  const isMember = await Team.findOne({
    projectId,
    userId,
    status: "active",
  });
  if (!isMember) throw new Error("Not authorized");

  // Make sure all these tasks actually belong to this project before doing a mass delete.
  const tasks = await Task.find({ _id: { $in: taskIds }, projectId, isDeleted: false });
  if (tasks.length !== taskIds.length) {
    throw new Error("Some tasks were not found in this project");
  }

  if (action === "delete") {
    // Bye bye tasks!
    await Task.updateMany({ _id: { $in: taskIds } }, { $set: { isDeleted: true } });
    await Task.updateMany({ parentId: { $in: taskIds } }, { $set: { isDeleted: true } });
    return { count: tasks.length, message: "Tasks deleted" };
  }
  
  if (action === "update") {
    const updateData = {};
    if (payload.status) updateData.status = payload.status;
    if (payload.priority) updateData.priority = payload.priority;
    if (payload.assignedTo !== undefined) updateData.assignedTo = payload.assignedTo;

    if (Object.keys(updateData).length > 0) {
      await Task.updateMany({ _id: { $in: taskIds } }, { $set: updateData });
    }
    return { count: tasks.length, message: "Tasks updated" };
  }

  throw new Error("Invalid bulk action");
}