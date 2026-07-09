import Conversation from "../models/conversation.model.js";
import DirectMessage from "../models/directMessage.model.js";
import User from "../models/user.model.js";

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name email avatar")
      .populate({
        path: "lastMessage",
        select: "content senderId createdAt",
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
    let { otherUserId, conversationId } = req.query;

    if (!conversationId && otherUserId) {
      // Find conversation by participants
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, otherUserId] }
      });
      if (conversation) {
        conversationId = conversation._id;
      } else {
        // Return empty messages if conversation doesn't exist yet
        return res.status(200).json({
          success: true,
          message: "Messages fetched",
          data: { conversationId: null, messages: [] },
        });
      }
    }

    if (!conversationId) {
      return res.status(400).json({ success: false, message: "No conversation specified" });
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
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "Receiver ID and content are required" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    // Create message
    const message = await DirectMessage.create({
      conversationId: conversation._id,
      senderId,
      content: content.trim(),
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

