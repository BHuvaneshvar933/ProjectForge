import express from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/calendar.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/events")
  .get(getEvents)
  .post(createEvent);

router.route("/events/:id")
  .put(updateEvent)
  .delete(deleteEvent);

export default router;
