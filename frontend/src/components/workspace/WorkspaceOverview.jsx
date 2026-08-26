import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Badge from "../common/Badge";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import { generateAIContent } from "../../api/aiApi";
import './WorkspaceOverview.css';

export default function WorkspaceOverview({ project, tasks, team, isOwner, onRemoveMember }) {
  const [aiLoading, setAiLoading] = useState(false);
  
  // Local state to instantly reflect new insights before full project refetch
  const [localMetrics, setLocalMetrics] = useState(project?.metrics || {});
  const overview = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Let's grab some stats from the last 7 days to see recent momentum.
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    let created7d = 0;
    let dueSoon7d = 0;

    // How many high, medium, and low priority tasks are we juggling?
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

    // Who is doing what? Let's tally up active tasks per team member.
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

    // Team Health Metrics
    let unassigned7d = 0;
    let stale7d = 0;
    let overdueCount = 0;

    tasks.forEach(t => {
      if (t.status !== 'done') {
        if (!t.assignedTo) unassigned7d++;
        
        const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : null;
        if (dueTime && dueTime < now) overdueCount++;

        const updatedTime = t.updatedAt ? new Date(t.updatedAt).getTime() : new Date(t.createdAt).getTime();
        if (updatedTime < sevenDaysAgo) stale7d++;
      }
    });

    const activeMembersCount = workloadList.filter(w => w.count > 0);
    const meanWorkload = activeMembersCount.length > 0 
      ? activeMembersCount.reduce((sum, w) => sum + w.count, 0) / activeMembersCount.length 
      : 0;
    const maxWorkload = activeMembersCount.length > 0 ? activeMembersCount[0].count : 0;
    const isImbalanced = activeMembersCount.length > 1 && maxWorkload > meanWorkload * 1.5 && maxWorkload - meanWorkload >= 2;

    const teamHealth = {
      problems: [
        ...(overdueCount > 0 ? [`${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`] : []),
        ...(isImbalanced ? [`Severe workload imbalance detected`] : [])
      ],
      risks: [
        ...(stale7d > 0 ? [`${stale7d} stale task${stale7d > 1 ? 's' : ''} (not updated in 7+ days)`] : []),
        ...(unassigned7d > 0 ? [`${unassigned7d} unassigned active task${unassigned7d > 1 ? 's' : ''}`] : [])
      ],
      awareness: [
        ...(dueSoon7d > 0 ? [`${dueSoon7d} task${dueSoon7d > 1 ? 's' : ''} approaching deadline`] : [])
      ]
    };

    // Calculate our velocity: how many tasks did we finish each day over the last week?
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
    
    // Grab the 5 most recently touched tasks so we can see what's currently active.
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
      recentTasks,
      teamHealth
    };
  }, [tasks, team]);

  return (
    <div className="workspace-overview">
      <div className="overview-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Project Overview</h2>
          <p>Insights and metrics for your team's performance.</p>
        </div>
        
        {project?.status !== "completed" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <Button 
              variant="outline" 
              onClick={async () => {
                setAiLoading(true);
                try {
                  const res = await generateAIContent("health-score", null, project._id);
                  setLocalMetrics(prev => ({ 
                    ...prev, 
                    aiHealthScore: res.data.data.result.health_score,
                    aiHealthStatus: res.data.data.result.status,
                    aiHealthComponents: res.data.data.result.components,
                    aiHealthMainRisk: res.data.data.result.main_risk,
                    aiHealthSuggestion: res.data.data.result.suggestion
                  }));
                  toast.success("Health Score generated!");
                } catch {
                  toast.error("Failed to generate Health Score");
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
            >
              {aiLoading ? <Spinner size="sm" /> : "❤️ Refresh Health Score"}
            </Button>

            <Button 
              variant="outline" 
              onClick={async () => {
                setAiLoading(true);
                try {
                  const res = await generateAIContent("weekly-summary", null, project._id);
                  setLocalMetrics(prev => ({ 
                    ...prev, 
                    aiWeeklySummary: res.data.data.result 
                  }));
                  toast.success("Weekly Summary generated!");
                } catch {
                  toast.error("Failed to generate Weekly Summary");
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
            >
              {aiLoading ? <Spinner size="sm" /> : "📝 Refresh Weekly Summary"}
            </Button>
          </div>
        )}
      </div>
      
      {/* AI Insights Section */}
      {(localMetrics.aiHealthScore || localMetrics.aiWeeklySummary) && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          {localMetrics.aiHealthScore !== undefined && (
            <div className="workspace__card" style={{ padding: "20px", flex: "1", borderLeft: localMetrics.aiHealthScore < 50 ? "4px solid #ff453a" : localMetrics.aiHealthScore < 80 ? "4px solid #ff9f0a" : "4px solid #32d74b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", margin: 0 }}>❤️ AI Health Score</h3>
                <Badge variant={localMetrics.aiHealthScore < 50 ? "danger" : localMetrics.aiHealthScore < 80 ? "warning" : "success"}>
                  {localMetrics.aiHealthScore}/100 - {localMetrics.aiHealthStatus}
                </Badge>
              </div>
              
              {localMetrics.aiHealthComponents && localMetrics.aiHealthComponents.length > 0 && (
                <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {localMetrics.aiHealthComponents.map((c, i) => (
                    <div key={i} style={{ fontSize: "14px" }}>
                      <span style={{ color: c.impact < 0 ? "#ff453a" : c.impact > 0 ? "#32d74b" : "rgba(255,255,255,0.7)", fontWeight: "bold", marginRight: "8px" }}>
                        {c.name} {c.impact > 0 ? `+${c.impact}` : c.impact}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>{c.reasoning || c.fact}</span>
                    </div>
                  ))}
                </div>
              )}

              {localMetrics.aiHealthMainRisk && (
                <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                  <strong style={{ color: "#ff9f0a" }}>Main Risk:</strong> <span style={{ color: "rgba(255,255,255,0.9)" }}>{localMetrics.aiHealthMainRisk}</span>
                </div>
              )}

              <div style={{ padding: "12px", background: "rgba(10,132,255,0.1)", borderRadius: "6px", border: "1px solid rgba(10,132,255,0.2)" }}>
                <span style={{ fontSize: "13px", color: "#0a84ff", fontWeight: "600", display: "block", marginBottom: "4px" }}>💡 AI Suggestion</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)" }}>{localMetrics.aiHealthSuggestion}</span>
              </div>
            </div>
          )}

          {localMetrics.aiWeeklySummary && (
            <div className="workspace__card" style={{ padding: "20px", flex: "1", borderLeft: "4px solid #bf5af2" }}>
              <h3 style={{ fontSize: "16px", margin: 0, marginBottom: "12px" }}>📝 AI Weekly Summary</h3>
              {typeof localMetrics.aiWeeklySummary === 'object' ? (
                <div>
                  <h4 style={{ fontSize: "15px", color: "rgba(255,255,255,0.9)", marginBottom: "16px" }}>{localMetrics.aiWeeklySummary.headline}</h4>
                  
                  {localMetrics.aiWeeklySummary.completed?.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "13px", textTransform: "uppercase" }}>Completed</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                        {localMetrics.aiWeeklySummary.completed.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {localMetrics.aiWeeklySummary.started?.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "13px", textTransform: "uppercase" }}>Started</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                        {localMetrics.aiWeeklySummary.started.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {localMetrics.aiWeeklySummary.risks?.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "13px", textTransform: "uppercase" }}>Risks</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                        {localMetrics.aiWeeklySummary.risks.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {localMetrics.aiWeeklySummary.next_actions?.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "13px", textTransform: "uppercase" }}>Next Actions</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                        {localMetrics.aiWeeklySummary.next_actions.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                  {localMetrics.aiWeeklySummary}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Team Health Alerts */}
      {(overview.teamHealth.problems.length > 0 || overview.teamHealth.risks.length > 0 || overview.teamHealth.awareness.length > 0) && (
        <div className="workspace__card" style={{ padding: "20px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", margin: 0, marginBottom: "16px" }}>🩺 Team Health</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {overview.teamHealth.problems.length > 0 && (
              <div>
                <h4 style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "8px" }}>🔴 Problems</h4>
                {overview.teamHealth.problems.map((prob, i) => (
                  <div key={`prob-${i}`} style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", marginBottom: "4px" }}>• {prob}</div>
                ))}
              </div>
            )}
            {overview.teamHealth.risks.length > 0 && (
              <div>
                <h4 style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "8px" }}>🟠 Risks</h4>
                {overview.teamHealth.risks.map((risk, i) => (
                  <div key={`risk-${i}`} style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", marginBottom: "4px" }}>• {risk}</div>
                ))}
              </div>
            )}
            {overview.teamHealth.awareness.length > 0 && (
              <div>
                <h4 style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "8px" }}>🟡 Awareness</h4>
                {overview.teamHealth.awareness.map((awar, i) => (
                  <div key={`awar-${i}`} style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", marginBottom: "4px" }}>• {awar}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
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

        {/* Team Workload */}
        <div className="overview-card">
          <h3 className="overview-card-title">Team Workload</h3>
          {overview.workloadList.length > 0 ? (
            <div className="overview-workload-list">
              {overview.workloadList.slice(0, 5).map((w, i) => (
                <div key={i} className="workload-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="workload-name" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{w.name}</span>
                  <span className="workload-count" style={{ fontSize: '14px', fontWeight: 'bold' }}>{w.count}</span>
                </div>
              ))}
              {overview.teamHealth.problems.includes('Severe workload imbalance detected') && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 69, 58, 0.1)', borderRadius: '6px', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                    <strong>Insight:</strong> Workload is unevenly distributed. Consider reassigning tasks to available members.
                  </span>
                </div>
              )}
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
        {/* Team Management */}
        <div className="overview-card col-span-2">
          <h3 className="overview-card-title">Team Members</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            {team.length > 0 ? team.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(10,132,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a84ff", fontWeight: "bold" }}>
                    {m?.userId?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "2px" }}>{m?.userId?.name || 'Unknown'}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{m?.projectRole || 'Member'}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Badge variant={m?.role === "owner" ? "owner" : "member"}>{m?.role === "owner" ? "owner" : "member"}</Badge>
                  {isOwner && m?.role !== "owner" && (
                    <button 
                      onClick={() => onRemoveMember && onRemoveMember(m?.userId?._id)}
                      style={{ background: "transparent", border: "1px solid rgba(255,69,58,0.5)", color: "#ff453a", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "16px" }}>No team members found.</div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
