import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DirectMessage",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index to find conversations for a user
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
