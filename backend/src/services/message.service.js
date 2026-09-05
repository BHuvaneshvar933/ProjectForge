import mongoose from "mongoose";
import Message from "../models/message.model.js";
import Team from "../models/team.model.js";

const ensureProjectMember = async ({ projectId, userId }) => {
  const membership = await Team.findOne({
    projectId,
    userId,
    status: "active",
    isDeleted: false,
  }).select("_id").lean();

  return Boolean(membership);
};

export const createMessage = async ({ projectId, userId, content }) => {
  const tStart = performance.now();

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

  const tVal = performance.now();

  const ok = await ensureProjectMember({ projectId, userId });
  if (!ok) {
    throw new Error("Access denied");
  }

  const tAuth = performance.now();

  const message = await Message.create({
    projectId,
    senderId: userId,
    content: trimmed,
    messageType: "text",
  });

  const tInsert = performance.now();

  await message.populate("senderId", "name email avatar");

  const tPopulate = performance.now();

  if (process.env.PROFILE_CHAT === 'true') {
    global.chatProfileStats = global.chatProfileStats || { count: 0, val: 0, auth: 0, insert: 0, populate: 0 };
    global.chatProfileStats.count++;
    global.chatProfileStats.val += (tVal - tStart);
    global.chatProfileStats.auth += (tAuth - tVal);
    global.chatProfileStats.insert += (tInsert - tAuth);
    global.chatProfileStats.populate += (tPopulate - tInsert);
    
    // Log every 100 messages to avoid console bottleneck
    if (global.chatProfileStats.count % 100 === 0) {
       console.log(`[PROFILE ${global.chatProfileStats.count}] Avg (ms) -> Val: ${(global.chatProfileStats.val / global.chatProfileStats.count).toFixed(2)} | Auth: ${(global.chatProfileStats.auth / global.chatProfileStats.count).toFixed(2)} | Insert: ${(global.chatProfileStats.insert / global.chatProfileStats.count).toFixed(2)} | Populate: ${(global.chatProfileStats.populate / global.chatProfileStats.count).toFixed(2)}`);
    }
  }

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
