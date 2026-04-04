import * as analyticsService from "../services/analytics.service.js";

export const getOverview = async (req, res, next) => {
  try {
    const overview = await analyticsService.getOverview(req.query);

    return res.status(200).json({
      success: true,
      message: "Analytics overview fetched",
      data: { overview },
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectSummary = async (req, res, next) => {
  try {
    const summary = await analyticsService.getProjectSummary({
      projectId: req.params.projectId,
      requesterId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Project analytics fetched",
      data: { summary },
    });
  } catch (err) {
    next(err);
  }
};

export const trackProjectView = async (req, res, next) => {
  try {
    const project = await analyticsService.trackProjectView(req.params.projectId);

    return res.status(200).json({
      success: true,
      message: "View tracked",
      data: { projectId: project._id, viewCount: project.viewCount },
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getProjectAnalytics({
      projectId: req.params.projectId,
      requesterId: req.user.id,
      days: req.query?.days,
    });

    return res.status(200).json({
      success: true,
      message: "Project analytics fetched",
      data: { analytics },
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectActivity = async (req, res, next) => {
  try {
    const activity = await analyticsService.getProjectActivity({
      projectId: req.params.projectId,
      requesterId: req.user.id,
      days: req.query?.days,
    });

    return res.status(200).json({
      success: true,
      message: "Project activity fetched",
      data: { activity },
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectMessageAnalytics = async (req, res, next) => {
  try {
    const messages = await analyticsService.getProjectMessageAnalytics({
      projectId: req.params.projectId,
      requesterId: req.user.id,
      days: req.query?.days,
    });

    return res.status(200).json({
      success: true,
      message: "Project message analytics fetched",
      data: { messages },
    });
  } catch (err) {
    next(err);
  }
};

export const getUserAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getUserAnalytics({
      userId: req.params.userId,
      requesterId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "User analytics fetched",
      data: { analytics },
    });
  } catch (err) {
    next(err);
  }
};

export const getUserProjectAnalytics = async (req, res, next) => {
  try {
    const result = await analyticsService.getUserProjectAnalytics({
      userId: req.params.userId,
      projectId: req.params.projectId,
      requesterId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "User project analytics fetched",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
