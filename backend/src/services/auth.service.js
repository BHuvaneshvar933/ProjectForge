import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "./email.service.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    stats: {}
  });

  const token = generateToken(user._id);

  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);

  return { user, token };
};

import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLoginUser = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  const { sub, email, name } = payload;

  let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }
  } else {
    user = await User.create({
      name,
      email,
      googleId: sub,
      stats: {}
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);
  return { user, token };
};

export const processForgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Return silently to prevent email enumeration
    return;
  }

  // Generate random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Save to DB (1 hour expiration)
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  // Send email
  await sendPasswordResetEmail(user.email, resetToken);
};

export const processResetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Password reset token is invalid or has expired");
  }

  // Update password and clear fields
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};