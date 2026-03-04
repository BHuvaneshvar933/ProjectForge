import * as TaskService from "../services/task.service.js";

export const createTask = async (req, res, next) => {
  try {
    const task = await TaskService.createTask(
      req.params.projectId,
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectTasks = async (req, res, next) => {
  try {
    const result = await TaskService.getProjectTasks(
      req.params.projectId,
      req.query,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const task = await TaskService.assignTask(
      req.params.taskId,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await TaskService.updateTaskStatus(
      req.params.taskId,
      status,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: task,
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await TaskService.deleteTask(
      req.params.taskId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Task deleted",
      data: task,
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await TaskService.updateTask(
      req.params.taskId,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Task updated",
      data: task,
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};