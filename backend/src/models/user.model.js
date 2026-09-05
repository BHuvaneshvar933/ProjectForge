import mongoose from "mongoose";

const portfolioLinksSchema = new mongoose.Schema({
  github: String,
  linkedin: String,
  website: String,
}, { _id: false });

const statsSchema = new mongoose.Schema({
  projectsCompleted: { type: Number, default: 0 },
  projectsActive: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  applicationsSent: { type: Number, default: 0 },
  applicationsAccepted: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: function() { return !this.googleId; },
      select: false,
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    bio: {
      type: String,
      default: "",
    },

    headline: {
      type: String,
      default: "",
    },

    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
    }],

    availabilityHoursPerWeek: {
      type: Number,
      default: 0,
    },

    structuredAvailability: {
      timeCommitment: { type: String, default: "" },
      preferredSchedule: { type: String, default: "" },
      projectDuration: { type: String, default: "" },
      canStart: { type: String, default: "" },
    },

    education: [{
      degree: String,
      program: String,
      university: String,
      startYear: String,
      graduationYear: String,
      currentYear: String,
      cgpa: String,
    }],

    experience: [{
      role: String,
      organization: String,
      startDate: String,
      endDate: String,
      description: String,
    }],

    achievements: [{
      title: String,
      organization: String,
      date: String,
      description: String,
    }],

    featuredProjects: [{
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
      order: { type: Number, default: 0 },
    }],

    portfolioLinks: portfolioLinksSchema,

    stats: statsSchema,

    reliability: {
      status: {
        type: String,
        enum: ["RELIABLE", "CAUTION", "CONCERN", "INSUFFICIENT_DATA"],
        default: "INSUFFICIENT_DATA"
      },
      confidence: {
        type: String,
        enum: ["INSUFFICIENT", "LOW", "MEDIUM", "HIGH"],
        default: "INSUFFICIENT"
      },
      lastCalculatedAt: Date,
      evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
      integritySignals: { type: [String], default: [] }
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    endorsements: [{
      endorsedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
      text: String,
      skills: [String],
      createdAt: { type: Date, default: Date.now }
    }],

    deletedAt: {
      type: Date,
      default: null,
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);