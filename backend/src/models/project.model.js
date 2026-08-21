import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema({
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalHoursLogged: { type: Number, default: 0 },
  velocityScore: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },
  aiHealthScore: { type: Number },
  aiHealthStatus: { type: String },
  aiHealthReasoning: { type: String },
  aiHealthSuggestion: { type: String },
  aiWeeklySummary: { type: String },
  aiLastGeneratedAt: { type: Date },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    key: {
      type: String,
      trim: true,
    },

    lastTaskNumber: {
      type: Number,
      default: 0,
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

    openRoles: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

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
      estimatedDuration: Number,
    },

    projectType: {
      type: String,
      enum: ["web", "mobile", "ml", "hackathon"],
      required: true,
    },

    status: {
      type: String,
      enum: ["recruiting", "in-progress", "completed"],
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

    githubIntegration: {
      isConnected: { type: Boolean, default: false },
      repoName: { type: String, default: "" }, // e.g. "facebook/react"
      accessToken: { type: String, default: "" },
    },

    archiveData: {
      timelineEvents: [
        {
          eventType: { type: String, default: "milestone" }, // creation, team_change, task, milestone
          title: String,
          description: String,
          date: { type: Date, default: Date.now },
        }
      ],

      deliverables: {
        sourceCodeUrl: String,
        demoVideoUrl: String,
        reportUrl: String,
        slidesUrl: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
