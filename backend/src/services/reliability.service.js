import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";

const EARLY_EXIT_WINDOW_DAYS = 7;
const EARLY_EXIT_MS = EARLY_EXIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const PROTECTED_DEPARTURE_REASONS = [
  "PROJECT_INACTIVE",
  "ACADEMIC_COMMITMENT",
  "SCHEDULE_CONFLICT",
  "REQUIREMENTS_CHANGED",
  "TEAM_CIRCUMSTANCES"
];

const PROTECTED_REMOVAL_REASONS = [
  "PROJECT_RESTRUCTURING",
  "PROJECT_CANCELLED",
  "ROLE_NO_LONGER_NEEDED"
];

export const calculateUserReliability = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) return null;

    const memberships = await Team.find({
      userId,
      isDeleted: false
    }).populate("projectId", "status createdAt updatedAt timeline");

    const tasks = await Task.find({ assignedTo: userId, status: "done", isDeleted: false }).select("projectId");
    const tasksByProject = {};
    for (const t of tasks) {
      const pid = String(t.projectId);
      tasksByProject[pid] = (tasksByProject[pid] || 0) + 1;
    }

    let successfulParticipations = 0;
    let earlyExits = 0;
    let removals = 0;
    let protectedDepartures = 0;
    let totalProjects = memberships.length;
    let integritySignals = [];

    for (const m of memberships) {
      if (!m.projectId) continue;

      const pid = String(m.projectId._id);
      const joinedAt = m.joinedAt ? m.joinedAt.getTime() : m.createdAt.getTime();
      const leftAt = m.leftAt ? m.leftAt.getTime() : Date.now();
      const durationMs = leftAt - joinedAt;
      const projectTasksCompleted = tasksByProject[pid] || 0;
      
      const isProjectCompleted = m.projectId.status === "completed";
      const projectDurationMs = m.projectId.updatedAt ? (m.projectId.updatedAt.getTime() - m.projectId.createdAt.getTime()) : 0;
      
      // Integrity Signals
      if (isProjectCompleted && projectDurationMs > 0 && projectDurationMs < 3 * 24 * 60 * 60 * 1000) {
        if (!integritySignals.includes("SUSPICIOUSLY_SHORT_PROJECT")) {
          integritySignals.push("SUSPICIOUSLY_SHORT_PROJECT");
        }
      }
      
      if (projectTasksCompleted > 15 && durationMs < 3 * 24 * 60 * 60 * 1000) {
        if (!integritySignals.includes("HIGH_TASK_ACTIVITY_SHORT_DURATION")) {
          integritySignals.push("HIGH_TASK_ACTIVITY_SHORT_DURATION");
        }
      }
      
      // Negative / Warning Signals
      if (m.status === "left") {
        if (durationMs < EARLY_EXIT_MS) {
          if (!PROTECTED_DEPARTURE_REASONS.includes(m.departureReason)) {
            earlyExits++;
          } else {
            protectedDepartures++;
          }
        } else if (PROTECTED_DEPARTURE_REASONS.includes(m.departureReason)) {
          protectedDepartures++;
        }
      } else if (m.status === "removed") {
        if (!PROTECTED_REMOVAL_REASONS.includes(m.removalReason)) {
          removals++;
        }
      }

      // Successful participation
      if (isProjectCompleted) {
        if (m.status === "active") {
           successfulParticipations++;
        } else if (m.status === "left" && PROTECTED_DEPARTURE_REASONS.includes(m.departureReason)) {
           if (durationMs >= EARLY_EXIT_MS) {
             successfulParticipations++;
           }
        }
      }
    }

    if (earlyExits >= 3) {
      if (!integritySignals.includes("REPEATED_JOIN_LEAVE")) {
        integritySignals.push("REPEATED_JOIN_LEAVE");
      }
    }

    let status = "INSUFFICIENT_DATA";
    let confidence = "INSUFFICIENT";

    // Evidence Quality / Confidence
    if (successfulParticipations >= 5 || (successfulParticipations >= 3 && totalProjects >= 5)) {
      confidence = "HIGH";
    } else if (successfulParticipations >= 2) {
      confidence = "MEDIUM";
    } else if (totalProjects >= 1) {
      confidence = "LOW";
    }

    // Status logic based on risk vs evidence
    const totalNegative = earlyExits + removals;

    if (totalNegative > 0) {
      let requiredToRecover = 0;
      if (totalNegative === 1) requiredToRecover = 3;
      else if (totalNegative >= 2) requiredToRecover = 6;
      
      if (successfulParticipations >= requiredToRecover) {
        status = "RELIABLE"; // Recovered
      } else if (totalNegative >= 2) {
        status = "CONCERN";
      } else {
        status = "CAUTION";
      }
    } else if (successfulParticipations >= 2) {
      status = "RELIABLE";
    }

    const evidence = {
      totalProjects,
      successfulParticipations,
      protectedDepartures,
      earlyExits,
      removals
    };

    user.reliability = {
      status,
      confidence,
      lastCalculatedAt: new Date(),
      evidence,
      integritySignals
    };

    await user.save();
    return user.reliability;
  } catch (error) {
    console.error(`Error calculating user reliability for ${userId}:`, error);
    throw error;
  }
};

export const recalculateAllUserReliability = async () => {
  const users = await User.find({ deletedAt: null }).select("_id");
  let processed = 0;
  for (const u of users) {
    try {
      await calculateUserReliability(u._id);
      processed++;
    } catch (err) {
      console.error(`Failed to recalculate for user ${u._id}`);
    }
  }
  return processed;
};
