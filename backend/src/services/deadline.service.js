import cron from "node-cron";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";

// Helper to determine the single most urgent threshold currently met
const getMostUrgentThreshold = (dueDate, now) => {
  const timeRemainingMs = dueDate.getTime() - now.getTime();
  const timeRemainingHours = timeRemainingMs / (1000 * 60 * 60);

  if (timeRemainingHours <= 0) return "overdue";
  if (timeRemainingHours <= 1) return "1_hour";
  if (timeRemainingHours <= 24) return "1_day";
  if (timeRemainingHours <= 72) return "3_days";

  return null;
};

// Formats the notification text based on the threshold
const getNotificationContent = (threshold, task) => {
  const dueDateStr = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(task.dueDate);

  switch (threshold) {
    case "3_days":
      return {
        type: "task_deadline_upcoming",
        title: "Task due in 3 days",
        message: `"${task.title}" is due on ${dueDateStr}.`,
      };
    case "1_day":
      return {
        type: "task_deadline_upcoming",
        title: "Task due tomorrow",
        message: `"${task.title}" is due on ${dueDateStr}.`,
      };
    case "1_hour":
      return {
        type: "task_deadline_upcoming",
        title: "Task due in 1 hour",
        message: `"${task.title}" is due soon at ${dueDateStr}.`,
      };
    case "overdue":
      return {
        type: "task_overdue",
        title: "Task overdue",
        message: `"${task.title}" was due on ${dueDateStr}.`,
      };
    default:
      return null;
  }
};

/**
 * Manually invocable function to process deadline alerts
 * Designed to be run by cron, but exported for manual testing.
 */
export const processDeadlineAlerts = async () => {
  try {
    const now = new Date();

    // Find incomplete tasks that have a due date and an assignee, populate preferences
    const tasks = await Task.find({
      status: { $ne: "done" },
      dueDate: { $ne: null },
      assignedTo: { $ne: null },
    }).populate("assignedTo", "notificationPreferences");

    for (const task of tasks) {
      if (!task.assignedTo) continue;

      const mostUrgent = getMostUrgentThreshold(task.dueDate, now);

      if (mostUrgent && !task.deadlineAlertsSent.includes(mostUrgent)) {
        // Check user preferences
        const prefs = task.assignedTo.notificationPreferences?.taskDeadlines || {};
        let shouldFire = true;
        
        switch (mostUrgent) {
          case "3_days": shouldFire = prefs.threeDaysBefore !== false; break;
          case "1_day": shouldFire = prefs.oneDayBefore !== false; break;
          case "1_hour": shouldFire = prefs.oneHourBefore !== false; break;
          case "overdue": shouldFire = prefs.overdue !== false; break;
        }

        if (shouldFire) {
          const content = getNotificationContent(mostUrgent, task);
          if (content) {
            // Create the notification
            await Notification.create({
              userId: task.assignedTo._id,
              type: content.type,
              title: content.title,
              message: content.message,
              actionUrl: `/workspace/${task.projectId}?task=${task._id}`, // Deep link to task
            });
            
            // Only mark as sent if we actually fired it
            task.deadlineAlertsSent.push(mostUrgent);
            await task.save();
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing deadline alerts:", error);
  }
};

/**
 * Initializes the cron job to run every 15 minutes.
 */
export const initDeadlineCron = () => {
  cron.schedule("*/15 * * * *", processDeadlineAlerts);
  console.log("Deadline alert cron job initialized.");
};
