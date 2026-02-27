import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema({
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalHoursLogged: { type: Number, default: 0 }, // future-safe
  velocityScore: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requiredSkills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
    }],

    teamSizeRequired: {
      type: Number,
      required: true,
    },

    currentTeamSize: {
      type: Number,
      default: 1,
    },

    timeline: {
      startDate: Date,
      endDate: Date,
      estimatedDuration: Number, // CRITICAL
    },

    projectType: {
      type: String,
      enum: ["web", "mobile", "ml", "hackathon"],
      required: true,
    },

    status: {
      type: String,
      enum: ["recruiting", "in-progress", "completed", "archived"],
      default: "recruiting",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    metrics: metricsSchema,

    tags: [String],

    viewCount: {
      type: Number,
      default: 0,
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

export default mongoose.model("Project", projectSchema);