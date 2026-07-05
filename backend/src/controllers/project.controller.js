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
    const team = await projectService.getProjectTeam(req.params.id, req.user._id);

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

export const leaveProject = async (req, res, next) => {
  try {
    const project = await projectService.leaveProject(
      req.user.id,
      req.params.projectId
    );

    res.status(200).json({
      success: true,
      message: "Successfully left the project",
      data: { project }
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectRecommendations = async (req, res, next) => {
  try {
    const recommendations = await projectService.getProjectRecommendations({
      userId: req.user._id,
      limit: req.query?.limit ?? 5,
    });

    return res.status(200).json({
      success: true,
      message: "Project recommendations fetched",
      data: { recommendations },
    });
  } catch (err) {
    next(err);
  }
};

export const updateArchiveData = async (req, res, next) => {
  try {
    const project = await projectService.updateArchiveData(
      req.user._id,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Archive data updated successfully",
      data: { project }
    });
  } catch (err) {
    next(err);
  }
};

import { getGitHubMetrics as fetchGitHubMetrics } from "../services/github.service.js";

export const connectGitHub = async (req, res, next) => {
  try {
    const project = await projectService.connectGitHub(
      req.user._id,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "GitHub connected successfully",
      data: { project }
    });
  } catch (err) {
    next(err);
  }
};

export const disconnectGitHub = async (req, res, next) => {
  try {
    const project = await projectService.disconnectGitHub(
      req.user._id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "GitHub disconnected successfully",
      data: { project }
    });
  } catch (err) {
    next(err);
  }
};

export const getGitHubMetrics = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user._id);
    
    if (!project.githubIntegration || !project.githubIntegration.isConnected) {
      return res.status(400).json({ success: false, message: "GitHub is not connected" });
    }

    const metrics = await fetchGitHubMetrics(
      project.githubIntegration.repoName,
      project.githubIntegration.accessToken
    );

    res.status(200).json({
      success: true,
      data: { metrics }
    });
  } catch (err) {
    next(err);
  }
};

import { getBasicRepoStats as fetchBasicRepoStats } from "../services/github.service.js";

export const getBasicRepoStats = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    
    const stats = await fetchBasicRepoStats(url);
    res.status(200).json({ success: true, data: { stats } });
  } catch (err) {
    next(err);
  }
};

export const getReleases = async (req, res, next) => {
  try {
    const releases = await projectService.getProjectReleases(req.params.id);
    res.status(200).json({
      success: true,
      data: { releases }
    });
  } catch (err) {
    next(err);
  }
};

export const createRelease = async (req, res, next) => {
  try {
    const release = await projectService.createProjectRelease(
      req.user._id,
      req.params.id,
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Release created successfully",
      data: { release }
    });
  } catch (err) {
    next(err);
  }
};

export const saveMyReflections = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user._id;
    const { reflections } = req.body;

    const membership = await projectService.saveMyReflections(projectId, userId, reflections);

    res.status(200).json({
      success: true,
      message: "Reflections saved successfully",
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
};
