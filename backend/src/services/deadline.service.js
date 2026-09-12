import cron from "node-cron";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";

// Helper to determine what thresholds have been met for a task
const getThresholdsMet = (dueDate, now) => {
  const timeRemainingMs = dueDate.getTime() - now.getTime();
  const timeRemainingHours = timeRemainingMs / (1000 * 60 * 60);

  const thresholdsMet = [];

  // Overdue: past due
  if (timeRemainingHours <= 0) {
    thresholdsMet.push("overdue");
  }
  // 1 hour: 1 hour or less remaining (but not overdue)
  if (timeRemainingHours > 0 && timeRemainingHours <= 1) {
    thresholdsMet.push("1_hour");
  }
  // 1 day: 24 hours or less remaining
  if (timeRemainingHours > 1 && timeRemainingHours <= 24) {
    thresholdsMet.push("1_day");
  }
  // 3 days: 72 hours or less remaining
  if (timeRemainingHours > 24 && timeRemainingHours <= 72) {
    thresholdsMet.push("3_days");
  }

  return thresholdsMet;
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

    // Find incomplete tasks that have a due date and an assignee
    // Note: If scale requires it, this should use a cursor/stream instead of loading all tasks.
    const tasks = await Task.find({
      status: { $ne: "done" },
      dueDate: { $ne: null },
      assignedTo: { $ne: null },
    });

    for (const task of tasks) {
      const thresholdsMet = getThresholdsMet(task.dueDate, now);

      // We process thresholds in chronological order of significance.
      // E.g., if it's overdue, we don't also fire 1-day alert if it somehow missed it.
      // But we just want to fire the MOST RELEVANT unmet threshold.
      // The array getThresholdsMet returns them in order of urgency: overdue -> 1_hour -> 1_day -> 3_days
      
      let alertFired = false;
      for (const threshold of thresholdsMet) {
        if (!alertFired && !task.deadlineAlertsSent.includes(threshold)) {
          // If the task missed earlier alerts (e.g., cron was down, or due date was set aggressively),
          // we only want to fire the MOST URGENT one, and then suppress the older ones by marking them as sent?
          // Actually, let's just fire the urgent one, and mark it. The next time the loop runs,
          // it won't fire the urgent one again (since it's in the array), and it MIGHT fire the less urgent one?
          // To prevent firing a "3 days" alert AFTER an "overdue" alert, we should mark ALL met thresholds as sent.
          
          const content = getNotificationContent(threshold, task);
          if (content) {
            // Create the notification
            await Notification.create({
              userId: task.assignedTo,
              type: content.type,
              title: content.title,
              message: content.message,
              actionUrl: `/workspace/${task.projectId}?task=${task._id}`, // Deep link to task
            });
          }
          alertFired = true; // Only send one physical notification per cron run per task
        }
      }

      // Mark all met thresholds as sent to avoid retroactively sending older alerts later
      let updated = false;
      for (const threshold of thresholdsMet) {
        if (!task.deadlineAlertsSent.includes(threshold)) {
          task.deadlineAlertsSent.push(threshold);
          updated = true;
        }
      }

      if (updated) {
        await task.save();
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
