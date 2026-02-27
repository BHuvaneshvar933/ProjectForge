import * as userService from "../services/user.service.js";

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateProfile(
      req.user._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await userService.getPublicUserProfile(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User profile fetched",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};