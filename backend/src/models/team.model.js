import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema({
  tasksCompleted: { type: Number, default: 0 },
  hoursLogged: { type: Number, default: 0 }, // future-safe
}, { _id: false });

const teamSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member",
    },

    // Role inside the project (e.g., "Backend Developer", "UI/UX Designer")
    projectRole: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
      default: "Member",
    },

    status: {
      type: String,
      enum: ["active", "left", "removed"],
      default: "active",
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    contribution: contributionSchema,

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

teamSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Team", teamSchema);
