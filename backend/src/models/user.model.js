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
      required: true,
      select: false,
    },

    bio: {
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

    portfolioLinks: portfolioLinksSchema,

    stats: statsSchema,

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);