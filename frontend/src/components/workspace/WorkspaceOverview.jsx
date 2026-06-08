import { useMemo } from "react";
import Badge from "../common/Badge";

export default function WorkspaceOverview({ tasks, team }) {
  const dashboardMetrics = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    let created7d = 0;
    let updated7d = 0;
    let completed7d = 0;
    let dueSoon7d = 0;

    let statusCount = { todo: 0, "in-progress": 0, done: 0 };
    let priorityCount = { high: 0, medium: 0, low: 0 };
    
    // Workload mapping: userId -> { user: {}, count: 0 }
    const workloadMap = {};
    team.forEach(m => {
      if (m?.userId?._id) {
        workloadMap[m.userId._id] = { user: m.userId, count: 0 };
      }
    });

    tasks.forEach(t => {
      const createdTime = new Date(t.createdAt).getTime();
      const updatedTime = new Date(t.updatedAt).getTime();
      const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : null;

      if (createdTime >= sevenDaysAgo) created7d++;
      if (updatedTime >= sevenDaysAgo) updated7d++;
      if (t.status === "done" && updatedTime >= sevenDaysAgo) completed7d++;
      if (t.status !== "done" && dueTime && dueTime >= now && dueTime <= sevenDaysFromNow) dueSoon7d++;

      if (t.status === "todo") statusCount.todo++;
      else if (t.status === "in-progress") statusCount["in-progress"]++;
      else if (t.status === "done") statusCount.done++;

      if (t.priority === "high") priorityCount.high++;
      else if (t.priority === "medium") priorityCount.medium++;
      else if (t.priority === "low") priorityCount.low++;

      if (t.status !== "done" && t.assignees && Array.isArray(t.assignees)) {
        t.assignees.forEach(assignee => {
          const assigneeId = typeof assignee === 'string' ? assignee : assignee._id;
          if (assigneeId && workloadMap[assigneeId]) {
            workloadMap[assigneeId].count++;
          }
        });
      }
    });

    const workloadList = Object.values(workloadMap).sort((a, b) => b.count - a.count);
    
    // Recent activity: top 5 recently updated tasks
    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      created7d,
      updated7d,
      completed7d,
      dueSoon7d,
      statusCount,
      priorityCount,
      workloadList,
      recentTasks,
      totalTasks: tasks.length
    };
  }, [tasks, team]);

  return (
    <div className="workspace__overview-layout" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Row: Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Completed (7d)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{dashboardMetrics.completed7d}</div>
        </div>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Updated (7d)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{dashboardMetrics.updated7d}</div>
        </div>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Created (7d)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{dashboardMetrics.created7d}</div>
        </div>
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "rgba(255,255,255,0.7)" }}>Due Soon (7d)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: dashboardMetrics.dueSoon7d > 0 ? "#ff9f0a" : "inherit" }}>{dashboardMetrics.dueSoon7d}</div>
        </div>
      </div>

      {/* Middle Row: Key Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        
        {/* Status Overview */}
        <div className="workspace__card">
          <div className="workspace__card-title">Status Overview</div>
          <div style={{ padding: "0 16px 16px 16px" }}>
            <div style={{ display: "flex", gap: "2px", height: "12px", borderRadius: "6px", overflow: "hidden", marginBottom: "16px", background: "rgba(255,255,255,0.1)" }}>
              {dashboardMetrics.totalTasks > 0 && (
                <>
                  <div style={{ width: `${(dashboardMetrics.statusCount.done / dashboardMetrics.totalTasks) * 100}%`, background: "#34c759" }} title={`Done: ${dashboardMetrics.statusCount.done}`} />
                  <div style={{ width: `${(dashboardMetrics.statusCount["in-progress"] / dashboardMetrics.totalTasks) * 100}%`, background: "#0a84ff" }} title={`In Progress: ${dashboardMetrics.statusCount["in-progress"]}`} />
                  <div style={{ width: `${(dashboardMetrics.statusCount.todo / dashboardMetrics.totalTasks) * 100}%`, background: "rgba(255,255,255,0.2)" }} title={`To Do: ${dashboardMetrics.statusCount.todo}`} />
                </>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34c759" }} /> Done</div>
                <span style={{ fontWeight: "bold" }}>{dashboardMetrics.statusCount.done}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0a84ff" }} /> In Progress</div>
                <span style={{ fontWeight: "bold" }}>{dashboardMetrics.statusCount["in-progress"]}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} /> To Do</div>
                <span style={{ fontWeight: "bold" }}>{dashboardMetrics.statusCount.todo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="workspace__card">
          <div className="workspace__card-title">Priority Breakdown</div>
          <div style={{ padding: "0 16px 16px 16px" }}>
            <div style={{ display: "flex", gap: "2px", height: "12px", borderRadius: "6px", overflow: "hidden", marginBottom: "16px", background: "rgba(255,255,255,0.1)" }}>
              {dashboardMetrics.totalTasks > 0 && (
                <>
                  <div style={{ width: `${(dashboardMetrics.priorityCount.high / dashboardMetrics.totalTasks) * 100}%`, background: "#ff453a" }} title={`High: ${dashboardMetrics.priorityCount.high}`} />
                  <div style={{ width: `${(dashboardMetrics.priorityCount.medium / dashboardMetrics.totalTasks) * 100}%`, background: "#ff9f0a" }} title={`Medium: ${dashboardMetrics.priorityCount.medium}`} />
                  <div style={{ width: `${(dashboardMetrics.priorityCount.low / dashboardMetrics.totalTasks) * 100}%`, background: "#32d74b" }} title={`Low: ${dashboardMetrics.priorityCount.low}`} />
                </>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff453a" }} /> High</div>
                <span style={{ fontWeight: "bold" }}>{dashboardMetrics.priorityCount.high}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff9f0a" }} /> Medium</div>
                <span style={{ fontWeight: "bold" }}>{dashboardMetrics.priorityCount.medium}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#32d74b" }} /> Low</div>
                <span style={{ fontWeight: "bold" }}>{dashboardMetrics.priorityCount.low}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Workload & Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        
        {/* Team Workload */}
        <div className="workspace__card">
          <div className="workspace__card-title">Team Workload</div>
          <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {dashboardMetrics.workloadList.length > 0 ? dashboardMetrics.workloadList.map((wl, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="workspace-member__avatar" style={{ width: "32px", height: "32px", fontSize: "14px" }}>
                    {(wl.user?.name || "U")[0]}
                  </div>
                  <span style={{ fontSize: "14px" }}>{wl.user?.name || "Unknown"}</span>
                </div>
                <Badge variant={wl.count > 5 ? "danger" : "default"}>{wl.count} open tasks</Badge>
              </div>
            )) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "16px" }}>No workload data available.</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="workspace__card">
          <div className="workspace__card-title">Recent Activity</div>
          <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {dashboardMetrics.recentTasks.length > 0 ? dashboardMetrics.recentTasks.map((t, i) => (
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
