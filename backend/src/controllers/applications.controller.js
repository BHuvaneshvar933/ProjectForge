import * as applicationService from "../services/applications.service.js";

export const applyToProject = async (req, res, next) => {
  try {
    const application = await applicationService.applyToProject(
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: { application }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const result = await applicationService.getMyApplications(
      req.user.id,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectApplications = async (req, res, next) => {
  try {
    const result = await applicationService.getProjectApplications(
      req.user.id,
      req.params.projectId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const acceptApplication = async (req, res, next) => {
  try {
    const result = await applicationService.acceptApplication(
      req.user.id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Application accepted successfully",
      data: { project: result }
    });
  } catch (err) {
    next(err);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const application = await applicationService.rejectApplication(
      req.user.id,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: { application }
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const application = await applicationService.withdrawApplication(
      req.user.id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
      data: { application }
    });
  } catch (err) {
    next(err);
  }
};