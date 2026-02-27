import * as skillService from "../services/skill.service.js";

export const getAllSkills = async (req, res, next) => {
  try {
    const skills = await skillService.getAllSkills();
    res.status(200).json({
      success: true,
      data: { skills }
    });
  } catch (err) {
    next(err);
  }
};

export const searchSkills = async (req, res, next) => {
  try {
    const { q } = req.query;
    const skills = await skillService.searchSkills(q);
    res.status(200).json({
      success: true,
      data: { skills }
    });
  } catch (err) {
    next(err);
  }
};