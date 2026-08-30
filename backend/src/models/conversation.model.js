import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// A conversation should be strictly unique per application
conversationSchema.index({ applicationId: 1 }, { unique: true });
// Index for fast querying by owner or applicant
conversationSchema.index({ ownerId: 1 });
conversationSchema.index({ applicantId: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
