import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import DirectMessage from "../models/directMessage.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import Application from "../models/application.model.js";

// Owner or Applicant starts a conversation
export const startConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: "Application ID is required" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const projectId = application.projectId;
    const applicantId = application.applicantId;

    // Verify the user is the owner of the project or the applicant
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const isOwner = String(project.owner) === String(userId);
    const isApplicant = String(applicantId) === String(userId);

    if (!isOwner && !isApplicant) {
      return res.status(403).json({ success: false, message: "Only the project owner or the applicant can initiate direct messages" });
    }

    // Find or create conversation for this specific application
    let conversation = await Conversation.findOne({ applicationId });

    if (!conversation) {
      conversation = await Conversation.create({
        applicationId,
        projectId,
        ownerId: project.owner, // Always set ownerId to the project's owner
        applicantId
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation started",
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Find all conversations where the user is either the owner or the applicant
    const conversations = await Conversation.find({
      $or: [{ ownerId: userId }, { applicantId: userId }]
    })
      .populate("ownerId", "name email avatar")
      .populate("applicantId", "name email avatar")
      .populate("projectId", "title")
      .populate("applicationId", "createdAt status")
      .populate({
        path: "lastMessage",
        select: "text senderId createdAt",
      })
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: "No conversation specified" });
    }

    // Verify access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (String(conversation.ownerId) !== String(userId) && String(conversation.applicantId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const messages = await DirectMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Messages fetched",
      data: { conversationId, messages },
    });
  } catch (err) {
    next(err);
  }
};

export const sendDirectMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const conversationId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Text content is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (String(conversation.ownerId) !== String(senderId) && String(conversation.applicantId) !== String(senderId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Create message
    const message = await DirectMessage.create({
      conversationId: conversation._id,
      senderId,
      text: text.trim(),
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    await message.populate("senderId", "name email avatar");

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (err) {
    next(err);
  }
};

export const markMessageSeen = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const messageId = req.params.id;

    const message = await DirectMessage.findById(messageId).populate("conversationId");
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const conversation = message.conversationId;
    if (String(conversation.ownerId) !== String(userId) && String(conversation.applicantId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (String(message.senderId) === String(userId)) {
      return res.status(400).json({ success: false, message: "Cannot mark own message as seen" });
    }

    message.seen = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message marked as seen",
    });
  } catch (err) {
    next(err);
  }
};
