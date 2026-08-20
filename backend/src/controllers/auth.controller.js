import * as authService from "../services/auth.service.js";

// Sign up a new user!
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

// Log the user in and hand them a token.
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

export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new Error("Token is required");
    }

    const result = await authService.googleLoginUser(token);

    return res.status(200).json({
      success: true,
      message: "Google Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get the currently logged in user profile.
export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User fetched",
    data: {
      user: req.user,
    },
  });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error("Email is required");
    }

    await authService.processForgotPassword(email);

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, we have sent a password reset link.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    await authService.processResetPassword(token, password);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};