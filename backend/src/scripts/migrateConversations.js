import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import Conversation from "../models/conversation.model.js";
import Application from "../models/application.model.js";

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const conversations = await Conversation.find({});
    console.log(`Found ${conversations.length} total conversations.`);

    let backfilled = 0;
    let missingApp = 0;
    let errors = 0;
    let alreadyHasApp = 0;

    for (const conv of conversations) {
      if (conv.applicationId) {
        alreadyHasApp++;
        continue;
      }

      const app = await Application.findOne({
        projectId: conv.projectId,
        applicantId: conv.applicantId,
      });

      if (app) {
        conv.applicationId = app._id;
        try {
          await conv.save();
          backfilled++;
          console.log(`Backfilled conv ${conv._id} with app ${app._id}`);
        } catch (e) {
          console.error(`Error saving conv ${conv._id}:`, e.message);
          errors++;
        }
      } else {
        console.warn(`No application found for conv ${conv._id} (Project: ${conv.projectId}, Applicant: ${conv.applicantId})`);
        missingApp++;
      }
    }

    console.log(`\nMigration Summary:`);
    console.log(`Already had applicationId: ${alreadyHasApp}`);
    console.log(`Successfully backfilled: ${backfilled}`);
    console.log(`Missing application (orphaned): ${missingApp}`);
    console.log(`Errors: ${errors}`);

  } catch (err) {
    console.error("Migration script failed:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

migrate();
