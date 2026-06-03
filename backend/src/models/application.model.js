import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      default: "",
    },

    applicationType: {
      type: String,
      enum: ["application", "invitation"],
      default: "application",
      index: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    invitedRole: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
      default: null,
    },

    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    reviewedAt: Date,

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ projectId: 1, applicantId: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
