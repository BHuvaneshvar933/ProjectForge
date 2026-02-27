import * as projectService from "../services/project.service.js";

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.user._id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project fetched",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const browseProjects = async (req, res, next) => {
  try {
    const result = await projectService.browseProjects(req.query);

    res.status(200).json({
      success: true,
      message: "Projects fetched",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getMyProjects(req.user._id);

    res.status(200).json({
      success: true,
      message: "My projects fetched",
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Project updated",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const closeRecruitment = async (req, res, next) => {
  try {
    const project = await projectService.closeRecruitment(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Recruitment closed",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const archiveProject = async (req, res, next) => {
  try {
    const project = await projectService.archiveProject(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Project archived",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectTeam = async (req, res, next) => {
  try {
    const team = await projectService.getProjectTeam(req.params.id);

    res.status(200).json({
      success: true,
      data: { team }
    });
  } catch (err) {
    next(err);
  }
};

export const getJoinedProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getJoinedProjects(req.user.id);

    res.status(200).json({
      success: true,
      data: { projects }
    });
  } catch (err) {
    next(err);
  }
};