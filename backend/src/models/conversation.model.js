import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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

// Prevent duplicate conversations between the same applicant and owner for the same project
conversationSchema.index({ projectId: 1, applicantId: 1 }, { unique: true });
// Index for fast querying by owner or applicant
conversationSchema.index({ ownerId: 1 });
conversationSchema.index({ applicantId: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
