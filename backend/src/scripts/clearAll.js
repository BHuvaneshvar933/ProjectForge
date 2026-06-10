import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

const clearAll = async () => {
  dotenv.config();
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  await connectDB();
  
  console.log("Dropping database...");
  await mongoose.connection.db.dropDatabase();
  console.log("✅ Database successfully dropped.");
  
  await mongoose.disconnect();
};

clearAll().catch(async (err) => {
  console.error("❌ Clear failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
