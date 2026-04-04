import * as messageService from "../services/message.service.js";

export const getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await messageService.getProjectMessages({
      projectId,
      userId: req.user._id,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Messages fetched",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
