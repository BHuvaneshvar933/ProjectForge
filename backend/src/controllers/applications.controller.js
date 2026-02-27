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