import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/project.model.js";

dotenv.config({ path: ".env" });

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration");

    const result = await Project.updateMany(
      { status: "archived" },
      { $set: { status: "completed" } }
    );
    console.log(`Migrated ${result.modifiedCount} archived projects to completed.`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
