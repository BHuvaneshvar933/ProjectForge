import React, { useMemo } from 'react';
import './WorkspaceAnalytics.css';

export default function WorkspaceAnalytics({ tasks, team }) {
  const analytics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Priority Breakdown
    const priorityCount = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      if (t.priority === 'high') priorityCount.high++;
      else if (t.priority === 'medium') priorityCount.medium++;
      else if (t.priority === 'low') priorityCount.low++;
    });

    // Workload Distribution
    const workload = {};
    team.forEach(m => {
      if (m?.userId) {
        workload[m.userId._id] = { name: m.userId.name, count: 0 };
      }
    });

    tasks.forEach(t => {
      if (t.status !== 'done' && t.assignedTo) {
        const aId = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo._id;
        if (workload[aId]) workload[aId].count++;
      }
    });

    const activeTasksCount = tasks.filter(t => t.status !== 'done').length;

    const workloadList = Object.values(workload)
      .sort((a, b) => b.count - a.count)
      .map(w => ({
        ...w,
        percentage: activeTasksCount > 0 ? (w.count / activeTasksCount) * 100 : 0
      }));

    // Velocity (Tasks completed in the last 7 days)
    const velocity = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = tasks.filter(t => {
        if (t.status !== 'done' || !t.updatedAt) return false;
        const up = new Date(t.updatedAt).getTime();
        return up >= d.getTime() && up < nextDay.getTime();
      }).length;

      velocity.push({
        date: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count
      });
    }

    const maxVelocity = Math.max(...velocity.map(v => v.count), 5); // Minimum scale of 5

    return {
      totalTasks,
      completedTasks,
      completionPercentage,
      priorityCount,
      workloadList,
      activeTasksCount,
      velocity,
      maxVelocity
    };
  }, [tasks, team]);

  return (
    <div className="workspace-analytics">
      <div className="analytics-header">
        <h2>Project Analytics</h2>
        <p>Insights and metrics for your team's performance.</p>
      </div>

      <div className="analytics-grid">
        
        {/* Progress Overview */}
        <div className="analytics-card col-span-2">
          <h3 className="analytics-card-title">Overall Progress</h3>
          <div className="analytics-progress-container">
            <div className="analytics-progress-bar">
              <div 
                className="analytics-progress-fill" 
                style={{ width: `${analytics.completionPercentage}%` }}
              ></div>
            </div>
            <div className="analytics-progress-stats">
              <span>{analytics.completionPercentage}% Complete</span>
              <span>{analytics.completedTasks} of {analytics.totalTasks} Tasks</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="analytics-card">
          <h3 className="analytics-card-title">Open Tasks by Priority</h3>
          <div className="analytics-priority-list">
            <div className="analytics-priority-item">
              <div className="priority-label">
                <span className="priority-dot high"></span> High
              </div>
              <div className="priority-value">{analytics.priorityCount.high}</div>
            </div>
            <div className="analytics-priority-item">
              <div className="priority-label">
                <span className="priority-dot medium"></span> Medium
              </div>
              <div className="priority-value">{analytics.priorityCount.medium}</div>
            </div>
            <div className="analytics-priority-item">
              <div className="priority-label">
                <span className="priority-dot low"></span> Low
              </div>
              <div className="priority-value">{analytics.priorityCount.low}</div>
            </div>
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="analytics-card col-span-2">
          <h3 className="analytics-card-title">Task Velocity (Last 7 Days)</h3>
          <div className="analytics-chart">
            {analytics.velocity.map((v, i) => (
              <div key={i} className="chart-bar-container">
                <div className="chart-value">{v.count > 0 ? v.count : ''}</div>
                <div 
                  className="chart-bar" 
                  style={{ height: `${(v.count / analytics.maxVelocity) * 100}%` }}
                ></div>
                <div className="chart-label">{v.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="analytics-card col-span-2">
          <h3 className="analytics-card-title">Workload Distribution (Active Tasks)</h3>
          {analytics.workloadList.length > 0 ? (
            <div className="analytics-workload-list">
              {analytics.workloadList.map((w, i) => (
                <div key={i} className="workload-item">
                  <div className="workload-info">
                    <span className="workload-name">{w.name}</span>
                    <span className="workload-count">{w.count} tasks</span>
                  </div>
                  <div className="workload-bar-bg">
                    <div 
                      className="workload-bar-fill" 
                      style={{ width: `${w.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-empty">No active tasks assigned.</div>
          )}
        </div>

      </div>
    </div>
  );
}
