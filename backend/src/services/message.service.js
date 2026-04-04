import mongoose from "mongoose";
import Message from "../models/message.model.js";
import Team from "../models/team.model.js";

const ensureProjectMember = async ({ projectId, userId }) => {
  const membership = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  }).select("_id");

  return Boolean(membership);
};

export const createMessage = async ({ projectId, userId, content }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("Message content required");
  }

  const trimmed = content.trim();
  if (trimmed.length > 1000) {
    throw new Error("Message too long");
  }

  const ok = await ensureProjectMember({ projectId, userId });
  if (!ok) {
    throw new Error("Access denied");
  }

  const message = await Message.create({
    projectId,
    senderId: userId,
    content: trimmed,
    messageType: "text",
  });

  await message.populate("senderId", "name email avatar");
  return message;
};

export const getProjectMessages = async ({ projectId, userId, page, limit }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const ok = await ensureProjectMember({ projectId, userId });
  if (!ok) {
    throw new Error("Access denied");
  }

  const pageNum = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const limitNum = Number.isFinite(Number(limit))
    ? Math.min(100, Math.max(1, Number(limit)))
    : 20;
  const skip = (pageNum - 1) * limitNum;

  const messages = await Message.find({
    projectId,
    isDeleted: false,
  })
    .populate("senderId", "name email avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    messages: messages.reverse(),
    pagination: {
      page: pageNum,
      limit: limitNum,
    },
  };
};
