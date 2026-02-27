import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    aliases: [String],

    category: {
      type: String,
      required: true,
    },

    popularityCount: {
      type: Number,
      default: 0,
    },

    relatedSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Skill", skillSchema);