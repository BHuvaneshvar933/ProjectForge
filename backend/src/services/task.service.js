import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import {
  handleTaskMarkedDone,
  handleTaskReopened,
} from "./metrics.service.js";

export const createTask = async (projectId, payload, currentUser) => {
  // VALIDATION PHASE

  const project = await Project.findById(projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "archived") {
    throw new Error("Project is archived");
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

  // Validate assignedTo (if provided)
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

  //TRANSACTION PHASE

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
          dueDate: payload.dueDate || null,
        },
      ],
      { session }
    );

    // Update metrics
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

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "archived") {
    throw new Error("Cannot modify tasks of archived project");
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

  // If assignedTo provided
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

export async function updateTaskStatus(taskId, newStatus, userId) {
  const validStatuses = ["todo", "in-progress", "done"];

  if (!validStatuses.includes(newStatus)) {
    throw new Error("Invalid status value");
  }

  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new Error("Task not found");
  }

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "archived") {
    throw new Error("Project is archived");
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

  //Cannot mark done if no assignee
  if (newStatus === "done" && !task.assignedTo) {
    throw new Error("Task must be assigned before marking as done");
  }

  // Simple transition (no metrics change)
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

  //Complex transitions require transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    task.status = newStatus;

    if (newStatus === "done") {
      task.completedAt = new Date();
      await task.save({ session });

      await handleTaskMarkedDone({ task, project, session });
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

  if (project.status === "archived") {
    throw new Error("Project is archived");
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

  const project = await Project.findById(task.projectId);

  if (!project || project.isDeleted) {
    throw new Error("Project not found");
  }

  if (project.status === "archived") {
    throw new Error("Project is archived");
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
    "tags",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      task[field] = updateData[field];
    }
  });

  await task.save();

  return task;
};