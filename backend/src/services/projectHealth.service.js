export const calculateProjectHealth = (project, tasks, team) => {
  const now = new Date();
  
  // Project Lifecycle & Age
  const projectAgeDays = Math.max(0, (now.getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const isProvisional = projectAgeDays < 7;
  
  // Basic Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "done").length;
  const tasksWithDeadlines = tasks.filter(t => t.dueDate).length;
  
  // Activity metrics (last 14 days)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recentTasks = tasks.filter(t => 
    new Date(t.updatedAt) > fourteenDaysAgo || new Date(t.createdAt) > fourteenDaysAgo
  );
  const recentActivityCount = recentTasks.length;
  
  // Engagement metrics
  const activeMembers = team.filter(m => m.status === "active");
  const totalMembers = activeMembers.length;
  
  const activeContributorsSet = new Set();
  recentTasks.forEach(t => {
    // Determine who contributed to the task. 
    // Ideally we track 'updatedBy', but for now we'll assume assignedTo means they contributed if it was recently updated.
    if (t.assignedTo) {
      activeContributorsSet.add(t.assignedTo._id ? t.assignedTo._id.toString() : t.assignedTo.toString());
    }
    // Also if the creator updated it
    if (t.createdBy) {
      activeContributorsSet.add(t.createdBy._id ? t.createdBy._id.toString() : t.createdBy.toString());
    }
  });
  const activeContributorsCount = activeContributorsSet.size;

  // Initialize dimensions
  let progressScore = 0;
  let scheduleScore = 0;
  let activityScore = 0;
  let engagementScore = 0;
  
  let factors = [];
  let risks = [];
  let confidence = "medium";

  if (totalTasks === 0) {
    // INSUFFICIENT DATA
    return {
      score: null,
      status: "Insufficient Data",
      confidence: "low",
      isProvisional: true,
      dimensions: {
        progress: { score: 0, max: 35 },
        schedule: { score: 0, max: 30 },
        activity: { score: 0, max: 20 },
        engagement: { score: 0, max: 15 }
      },
      factors: ["No tasks created yet"],
      risks: []
    };
  }

  // 1. PROGRESS (35)
  const completionRate = completedTasks / totalTasks;
  
  if (totalTasks < 3) {
    // Tiny project guardrail
    if (completedTasks === totalTasks) {
      progressScore = 35;
      factors.push("All tasks completed");
    } else if (overdueTasks > 0) {
      progressScore = 0;
      risks.push("Tasks are overdue and incomplete");
    } else {
      progressScore = 15; // Moderate progress for active but tiny project
      factors.push("Project has active tasks");
    }
  } else {
    // Normal calculation
    if (completionRate >= 0.9) progressScore = 35;
    else if (completionRate >= 0.75) progressScore = 30;
    else if (completionRate >= 0.5) progressScore = 22;
    else if (completionRate >= 0.25) progressScore = 14;
    else if (completionRate > 0) progressScore = 7;
    else progressScore = 0;
    
    factors.push(`${Math.round(completionRate * 100)}% of tasks completed`);
  }

  // 2. SCHEDULE (30)
  if (tasksWithDeadlines === 0) {
    // No deadlines
    scheduleScore = 15; // Neutral
    confidence = "low";
    factors.push("No task deadlines defined");
  } else {
    const overdueRate = overdueTasks / tasksWithDeadlines;
    
    if (totalTasks < 3 && overdueTasks > 0) {
      scheduleScore = 0; // Punish tiny projects with overdue tasks
      risks.push("Overdue tasks detected in a small project");
    } else {
      if (overdueRate === 0) scheduleScore = 30;
      else if (overdueRate <= 0.1) scheduleScore = 25;
      else if (overdueRate <= 0.25) scheduleScore = 18;
      else if (overdueRate <= 0.5) scheduleScore = 10;
      else {
        scheduleScore = 0;
        risks.push("High proportion of tasks are overdue");
      }
    }
    
    if (overdueTasks > 0) {
      factors.push(`${overdueTasks} task(s) overdue`);
    } else {
      factors.push("All scheduled tasks are on time");
    }
  }

  // 3. ACTIVITY (20)
  // Define strict thresholds relative to project size, but bounded.
  let activityRate = recentActivityCount / Math.max(1, totalTasks);
  
  if (recentActivityCount >= 5 || (recentActivityCount >= 2 && activityRate >= 0.5)) {
    activityScore = 20;
    factors.push("Strong recent activity");
  } else if (recentActivityCount >= 3 || (recentActivityCount >= 1 && activityRate >= 0.25)) {
    activityScore = 14;
    factors.push("Moderate recent activity");
  } else if (recentActivityCount > 0) {
    activityScore = 7;
    factors.push("Low recent activity");
    risks.push("Project momentum is slowing");
  } else {
    activityScore = 0;
    risks.push("No recent activity in the last 14 days");
  }

  // 4. TEAM ENGAGEMENT (15)
  if (totalMembers === 0) {
    engagementScore = 0;
    factors.push("No active team members");
  } else {
    const participation = activeContributorsCount / totalMembers;
    
    if (participation >= 0.8) engagementScore = 15;
    else if (participation >= 0.6) engagementScore = 12;
    else if (participation >= 0.4) engagementScore = 8;
    else if (participation > 0) {
      engagementScore = 4;
      risks.push("Low team participation");
    } else {
      engagementScore = 0;
      risks.push("No active team contributions recently");
    }
    
    factors.push(`${activeContributorsCount} of ${totalMembers} members contributed recently`);
  }

  // Final Calculations
  const totalScore = progressScore + scheduleScore + activityScore + engagementScore;
  
  // Adjust confidence based on multiple factors
  if (totalTasks >= 5 && tasksWithDeadlines >= 2 && !isProvisional) {
    confidence = "high";
  } else if (totalTasks < 3 || isProvisional || tasksWithDeadlines === 0) {
    confidence = "low";
  } else {
    confidence = "medium";
  }

  // Determine Status Band
  let status = "";
  if (totalScore >= 85) status = "Excellent";
  else if (totalScore >= 70) status = "Healthy";
  else if (totalScore >= 50) status = "Needs Attention";
  else if (totalScore >= 30) status = "At Risk";
  else status = "Critical";

  return {
    score: totalScore,
    status,
    confidence,
    isProvisional,
    dimensions: {
      progress: { score: progressScore, max: 35 },
      schedule: { score: scheduleScore, max: 30 },
      activity: { score: activityScore, max: 20 },
      engagement: { score: engagementScore, max: 15 }
    },
    factors,
    risks
  };
};
