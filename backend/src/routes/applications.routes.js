import express from "express";
import * as applicationController from "../controllers/applications.controller.js";
import {protect} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, applicationController.applyToProject);
router.post("/invite", protect, applicationController.inviteUserToProject);
router.get("/sent", protect, applicationController.getMyApplications); //Make sure this is ABOVE any /:id route later.
router.get(
  "/received/:projectId",
  protect,
  applicationController.getProjectApplications
);
router.patch(
  "/:id/accept",
  protect,
  applicationController.acceptApplication
);
router.patch(
  "/:id/reject",
  protect,
  applicationController.rejectApplication
);
router.patch(
  "/:id/withdraw",
  protect,
  applicationController.withdrawApplication
);
router.patch(
  "/:id/respond",
  protect,
  applicationController.respondToInvitation
);

export default router;
