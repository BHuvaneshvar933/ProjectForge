import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import mongoose from "mongoose";
import { recalculateAllUserReliability } from "./services/reliability.service.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    const count = await recalculateAllUserReliability();
    console.log(`Successfully recalculated reliability for ${count} users.`);
    
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
