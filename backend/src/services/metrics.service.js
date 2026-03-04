import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";


 // Recalculate completion percentage
function calculateCompletionPercentage(total, completed) {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Handle when a task is marked as DONE
export async function handleTaskMarkedDone({ task, project, session }) {
  
  project.metrics.completedTasks += 1;

  if (project.metrics.completedTasks < 0) {
    project.metrics.completedTasks = 0;
  }

  //Recalculate completion percentage
  project.metrics.completionPercentage = calculateCompletionPercentage(
    project.metrics.totalTasks,
    project.metrics.completedTasks
  );

  await project.save({ session });

  //Update team + user contribution if assigned
  if (task.assignedTo) {
    await Team.updateOne(
      {
        projectId: project._id,
        userId: task.assignedTo,
        status: "active",
      },
      {
        $inc: { "contribution.tasksCompleted": 1 },
      },
      { session }
    );

    await User.updateOne(
      { _id: task.assignedTo },
      {
        $inc: { "stats.tasksCompleted": 1 },
      },
      { session }
    );
  }
}

//Handle when a DONE task is reopened
export async function handleTaskReopened({ task, project, session }) {
  project.metrics.completedTasks -= 1;

  if (project.metrics.completedTasks < 0) {
    project.metrics.completedTasks = 0;
  }

  //Recalculate percentage
  project.metrics.completionPercentage = calculateCompletionPercentage(
    project.metrics.totalTasks,
    project.metrics.completedTasks
  );

  await project.save({ session });

  //Update contribution counters
  if (task.assignedTo) {
    await Team.updateOne(
      {
        projectId: project._id,
        userId: task.assignedTo,
        status: "active",
      },
      {
        $inc: { "contribution.tasksCompleted": -1 },
      },
      { session }
    );

    await User.updateOne(
      { _id: task.assignedTo },
      {
        $inc: { "stats.tasksCompleted": -1 },
      },
      { session }
    );
  }
}