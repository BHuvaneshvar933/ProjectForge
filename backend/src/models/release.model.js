import mongoose from "mongoose";

const ReleaseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["UNRELEASED", "RELEASED", "ARCHIVED"],
      default: "UNRELEASED",
    },
    progress: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    releaseDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, optimisticConcurrency: true }
);

export default mongoose.model("Release", ReleaseSchema);
