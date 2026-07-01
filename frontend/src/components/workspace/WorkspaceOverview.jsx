import React, { useMemo } from 'react';
import Badge from "../common/Badge";
import './WorkspaceOverview.css';

export default function WorkspaceOverview({ tasks, team }) {
  const overview = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 7 days metrics
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    let created7d = 0;
    let dueSoon7d = 0;

    // Priority Breakdown
    const priorityCount = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      if (t.priority === 'high') priorityCount.high++;
      else if (t.priority === 'medium') priorityCount.medium++;
      else if (t.priority === 'low') priorityCount.low++;
      
      const createdTime = new Date(t.createdAt).getTime();
      const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : null;
      if (createdTime >= sevenDaysAgo) created7d++;
      if (t.status !== "done" && dueTime && dueTime >= now && dueTime <= sevenDaysFromNow) dueSoon7d++;
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
    const nowDate = new Date();
    let completed7d = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowDate);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = tasks.filter(t => {
        if (t.status !== 'done' || !t.updatedAt) return false;
        const up = new Date(t.updatedAt).getTime();
        return up >= d.getTime() && up < nextDay.getTime();
      }).length;
      
      completed7d += count;

      velocity.push({
        date: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count
      });
    }

    const maxVelocity = Math.max(...velocity.map(v => v.count), 5); // Minimum scale of 5
    
    // Recent activity: top 5 recently updated tasks
    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalTasks,
      completedTasks,
      completionPercentage,
      priorityCount,
      workloadList,
      activeTasksCount,
      velocity,
      maxVelocity,
      created7d,
      completed7d,
      dueSoon7d,
      recentTasks
    };
  }, [tasks, team]);

  return (
    <div className="workspace-overview">
      <div className="overview-header">
        <h2>Project Overview</h2>
        <p>Insights and metrics for your team's performance.</p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Completed (7d)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{overview.completed7d}</div>
        </div>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Created (7d)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{overview.created7d}</div>
        </div>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Due Soon</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: overview.dueSoon7d > 0 ? "#ff9f0a" : "inherit" }}>{overview.dueSoon7d}</div>
        </div>
      </div>

      <div className="overview-grid">
        {/* Progress Overview */}
        <div className="overview-card col-span-2">
          <h3 className="overview-card-title">Overall Progress</h3>
          <div className="overview-progress-container">
            <div className="overview-progress-bar">
              <div 
                className="overview-progress-fill" 
                style={{ width: `${overview.completionPercentage}%` }}
              ></div>
            </div>
            <div className="overview-progress-stats">
              <span>{overview.completionPercentage}% Complete</span>
              <span>{overview.completedTasks} of {overview.totalTasks} Tasks</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="overview-card">
          <h3 className="overview-card-title">Open Tasks by Priority</h3>
          <div className="overview-priority-list">
            <div className="overview-priority-item">
              <div className="priority-label">
                <span className="priority-dot high"></span> High
              </div>
              <div className="priority-value">{overview.priorityCount.high}</div>
            </div>
            <div className="overview-priority-item">
              <div className="priority-label">
                <span className="priority-dot medium"></span> Medium
              </div>
              <div className="priority-value">{overview.priorityCount.medium}</div>
            </div>
            <div className="overview-priority-item">
              <div className="priority-label">
                <span className="priority-dot low"></span> Low
              </div>
              <div className="priority-value">{overview.priorityCount.low}</div>
            </div>
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="overview-card">
          <h3 className="overview-card-title">Workload Distribution</h3>
          {overview.workloadList.length > 0 ? (
            <div className="overview-workload-list">
              {overview.workloadList.slice(0, 5).map((w, i) => (
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
            <div className="overview-empty">No active tasks assigned.</div>
          )}
        </div>

        {/* Velocity Chart */}
        <div className="overview-card col-span-2">
          <h3 className="overview-card-title">Task Velocity (Last 7 Days)</h3>
          <div className="overview-chart">
            {overview.velocity.map((v, i) => (
              <div key={i} className="chart-bar-container">
                <div className="chart-value">{v.count > 0 ? v.count : ''}</div>
                <div 
                  className="chart-bar" 
                  style={{ height: `${(v.count / overview.maxVelocity) * 100}%` }}
                ></div>
                <div className="chart-label">{v.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card col-span-2">
          <h3 className="overview-card-title">Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            {overview.recentTasks.length > 0 ? overview.recentTasks.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>{t.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Updated {new Date(t.updatedAt).toLocaleDateString()}</div>
                </div>
                <Badge variant={t.status === "done" ? "success" : "default"}>{t.status.replace("-", " ")}</Badge>
              </div>
            )) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "16px" }}>No recent activity.</div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
