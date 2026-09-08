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
    if (t.assignedTo) activeContributorsSet.add(t.assignedTo._id ? t.assignedTo._id.toString() : t.assignedTo.toString());
    if (t.createdBy) activeContributorsSet.add(t.createdBy._id ? t.createdBy._id.toString() : t.createdBy.toString());
  });
  const activeContributorsCount = activeContributorsSet.size;

  let progressScore = 0;
  let scheduleScore = 0;
  let activityScore = 0;
  let teamDistributionScore = 0;
  
  let factors = [];
  let risks = [];
  let confidence = "medium";

  if (totalTasks === 0) {
    return {
      score: null,
      status: "Insufficient Data",
      confidence: "low",
      isProvisional: true,
      dimensions: {
        progress: { score: 0, max: 35 },
        schedule: { score: 0, max: 30 },
        activity: { score: 0, max: 20 },
        teamDistribution: { score: 0, max: 15 }
      },
      factors: ["No tasks created yet"],
      risks: []
    };
  }

  // 1. PROGRESS (35)
  const completionRate = completedTasks / totalTasks;
  
  if (completionRate >= 0.9) progressScore = 35;
  else if (completionRate >= 0.75) progressScore = 30;
  else if (completionRate >= 0.5) progressScore = 22;
  else if (completionRate >= 0.25) progressScore = 14;
  else if (completionRate > 0) progressScore = 7;
  else {
    if (overdueTasks === 0 && recentActivityCount > 0) {
      progressScore = 15;
      factors.push("Tasks are active and progressing");
    } else {
      progressScore = 10;
      factors.push("No tasks have been completed yet");
    }
  }

  if (completedTasks > 0) {
    factors.push(`${Math.round(completionRate * 100)}% of tasks completed`);
  }

  // 2. SCHEDULE (30)
  if (tasksWithDeadlines === 0) {
    scheduleScore = 25; // Neutral-good since they aren't failing any deadlines
    factors.push("No task deadlines defined");
  } else {
    const overdueRate = overdueTasks / tasksWithDeadlines;
    
    if (overdueTasks === 0) {
      scheduleScore = 30;
      factors.push("All scheduled tasks are on time");
    } else if (overdueTasks === 1 && totalTasks < 5) {
      scheduleScore = 20; 
      risks.push("One task is currently overdue");
    } else {
      if (overdueRate <= 0.1) scheduleScore = 25;
      else if (overdueRate <= 0.25) scheduleScore = 18;
      else if (overdueRate <= 0.5) scheduleScore = 10;
      else {
        scheduleScore = 5;
        risks.push("High proportion of tasks are overdue");
      }
    }
    
    if (overdueTasks > 0) {
      factors.push(`${overdueTasks} task(s) overdue`);
    }
  }

  // 3. ACTIVITY (20)
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

  // 4. TEAM DISTRIBUTION (15)
  // Calculate workload concentration
  if (totalTasks === 0 || totalMembers === 0) {
    teamDistributionScore = 15; // Neutral-good if no workload to distribute
    factors.push("No active workload to distribute");
  } else {
    // Check how many tasks each member is assigned
    const memberWorkload = {};
    activeMembers.forEach(m => {
      memberWorkload[m.userId ? m.userId.toString() : m._id.toString()] = 0;
    });
    
    let assignedTasksCount = 0;
    tasks.filter(t => t.status !== 'done').forEach(t => {
      if (t.assignedTo) {
        const assignedId = typeof t.assignedTo === 'object' && t.assignedTo !== null 
          ? (t.assignedTo._id ? t.assignedTo._id.toString() : t.assignedTo.toString())
          : t.assignedTo.toString();
        
        if (memberWorkload[assignedId] !== undefined) {
          memberWorkload[assignedId]++;
          assignedTasksCount++;
        }
      }
    });

    if (assignedTasksCount === 0) {
      teamDistributionScore = 5;
      risks.push("Active tasks have no assigned owners");
    } else {
      const maxWorkload = Math.max(...Object.values(memberWorkload));
      const concentrationRatio = maxWorkload / assignedTasksCount;

      if (concentrationRatio <= 0.4 || (assignedTasksCount === 1)) {
        teamDistributionScore = 15;
        if (assignedTasksCount > 1) factors.push("Workload is well distributed across the team");
      } else if (concentrationRatio <= 0.6) {
        teamDistributionScore = 12;
        factors.push("Workload is adequately distributed");
      } else if (concentrationRatio <= 0.8) {
        teamDistributionScore = 8;
        risks.push("Workload is slightly concentrated on a single member");
      } else {
        teamDistributionScore = 5;
        risks.push("Active workload is highly concentrated on a single member");
      }
    }
  }

  const totalScore = progressScore + scheduleScore + activityScore + teamDistributionScore;
  
  if (totalTasks >= 5 && tasksWithDeadlines >= 2 && !isProvisional) {
    confidence = "high";
  } else if (totalTasks < 3 || isProvisional || tasksWithDeadlines === 0) {
    confidence = "low";
  } else {
    confidence = "medium";
  }

  let status = "";
  if (totalScore >= 70) status = "Healthy";
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
      teamDistribution: { score: teamDistributionScore, max: 15 }
    },
    factors,
    risks
  };
};
