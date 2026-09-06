import * as projectService from "../services/project.service.js";
import { calculateProjectHealth } from "../services/projectHealth.service.js";
import { generateHealthExplanation, generateEngineeringAssessment as generateAssessmentAI } from "../services/ai.service.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";
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
    const query = { ...req.query };
    if (req.user) {
      query.userId = req.user._id;
    }
    const result = await projectService.browseProjects(query);

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
      req.params.projectId,
      req.body.reason,
      req.body.note
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

export const removeTeamMember = async (req, res, next) => {
  try {
    const project = await projectService.removeTeamMember(
      req.user.id,
      req.params.projectId,
      req.params.userId,
      req.body.removalReason
    );

    res.status(200).json({
      success: true,
      message: "Successfully removed team member",
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

export const updatePersonalJourney = async (req, res, next) => {
  try {
    const journey = await projectService.updatePersonalJourney(
      req.user._id,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Personal journey updated successfully",
      data: { journey }
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

export const updateRelease = async (req, res, next) => {
  try {
    const release = await projectService.updateProjectRelease(
      req.user._id,
      req.params.id,
      req.params.releaseId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Release updated successfully",
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

export const getProjectFiles = async (req, res, next) => {
  try {
    const files = await projectService.getProjectFiles(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: { files } });
  } catch (error) {
    next(error);
  }
};

export const addProjectFile = async (req, res, next) => {
  try {
    const file = await projectService.addProjectFile(req.params.id, req.user._id, req.body);
    res.status(201).json({ success: true, data: { file } });
  } catch (error) {
    next(error);
  }
};

export const getEngineeringAssessment = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await projectService.getProjectById(projectId, req.user._id);
    
    // Gather deterministic metrics for the AI to interpret
    const tasks = await Task.find({ projectId, isDeleted: false });
    
    const now = new Date();
    const openTasks = tasks.filter(t => t.status !== "done");
    const completedTasks = tasks.filter(t => t.status === "done");
    const overdueTasks = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const openBugs = openTasks.filter(t => t.type === "bug");
    
    const isGithubConnected = project.githubIntegration && project.githubIntegration.isConnected;
    
    let githubData = { available: false, reason: "Not connected", metrics: null };
    
    if (isGithubConnected) {
       try {
         const metrics = await fetchGitHubMetrics(
           project.githubIntegration.repoName,
           project.githubIntegration.accessToken
         );
         githubData = { available: true, repo: project.githubIntegration.repoName, metrics };
       } catch (err) {
         console.error("Failed to fetch GitHub metrics for assessment", err);
         githubData = { available: false, reason: "Error fetching data from connected repository", metrics: null };
       }
    }

    // Determine evidence availability
    const hasTaskData = tasks.length > 0;
    const hasGithubData = githubData.available;
    
    const projectData = {
      title: project.title,
      tasks: {
        available: hasTaskData,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        openBugs: openBugs.length,
        overdueTasks: overdueTasks.length,
      },
      github: githubData
    };

    let systemStatus = "Healthy";
    
    // Check for negative evidence
    let hasNegativeEvidence = false;
    let negativeReasons = [];

    if (hasTaskData) {
        if (overdueTasks.length > 0) {
            hasNegativeEvidence = true;
            negativeReasons.push(`${overdueTasks.length} overdue task(s)`);
        }
        if (openBugs.length > 0) {
            hasNegativeEvidence = true;
            negativeReasons.push(`${openBugs.length} open bug(s)`);
        }
    }

    if (hasGithubData && githubData.metrics) {
        if (githubData.metrics.criticalVulnerabilities > 0) {
            hasNegativeEvidence = true;
            negativeReasons.push(`${githubData.metrics.criticalVulnerabilities} critical vulnerability(ies)`);
        }
    }

    if (hasNegativeEvidence) {
        systemStatus = "Needs Attention";
    } else if (!hasTaskData && !hasGithubData) {
        systemStatus = "Insufficient Data";
    } else if (!hasTaskData || !hasGithubData) {
        systemStatus = "Limited Evidence";
    } else {
        systemStatus = "Healthy";
    }

    // Pass the calculated status to the AI so it can incorporate it into the explanation
    projectData.determinedStatus = systemStatus;
    projectData.negativeReasons = negativeReasons;

    const assessment = await generateAssessmentAI(projectData);
    
    // Ensure the AI doesn't override our status
    assessment.status = systemStatus;

    res.status(200).json({ success: true, data: { assessment } });
  } catch (error) {
    next(error);
  }
};

export const getProjectHealth = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const tasks = await Task.find({ projectId, isDeleted: false });
    const team = await Team.find({ projectId, status: "active", isDeleted: false });

    // 1. Calculate deterministic metrics
    const metrics = calculateProjectHealth(project, tasks, team);

    // 2. Generate AI Explanation
    let aiExplanation = { main_risk: "Unavailable", suggestion: "Unavailable" };
    if (metrics.score !== null) {
      aiExplanation = await generateHealthExplanation(project, metrics);
    }

    // 3. Combine and return
    const result = {
      health_score: metrics.score,
      status: metrics.status,
      confidence: metrics.confidence,
      isProvisional: metrics.isProvisional,
      dimensions: metrics.dimensions,
      main_risk: aiExplanation.main_risk,
      suggestion: aiExplanation.suggestion
    };

    res.status(200).json({
      success: true,
      message: "Health score generated",
      data: { result },
    });
  } catch (error) {
    next(error);
  }
};
