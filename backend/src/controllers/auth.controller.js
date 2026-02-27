import * as authService from "../services/auth.service.js";

//registr
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const { user, token } = await authService.registerUser({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

//login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await authService.loginUser({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

//get user
export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User fetched",
    data: {
      user: req.user,
    },
  });
};