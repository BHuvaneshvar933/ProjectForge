import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

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