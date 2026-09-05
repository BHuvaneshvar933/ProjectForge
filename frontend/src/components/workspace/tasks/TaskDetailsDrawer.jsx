import React from "react";
import Input from "../../common/Input";
import Button from "../../common/Button";

export default function TaskDetailsDrawer({ task, project, teamSorted, releases = [], onClose, onUpdate, onDelete, hasConflict, onReloadLatest }) {
  if (!task) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "500px",
      height: "100vh",
      background: "var(--bg-card)",
      borderLeft: "1px solid var(--color-border-medium)",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      transform: "translateX(0)",
      transition: "transform 0.3s ease"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--color-border-medium)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a href="#" style={{ color: "#0a84ff", textDecoration: "none", fontWeight: "600" }}>{project?.key || "PROJ"}-{task.taskNumber}</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this task?")) {
                if (onDelete) onDelete(task._id);
              }
            }} 
            style={{ background: "transparent", border: "1px solid rgba(255,69,58,0.3)", color: "#ff453a", cursor: "pointer", fontSize: "12px", padding: "4px 8px", borderRadius: "4px" }}
          >
            Delete Task
          </button>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "20px" }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {hasConflict && (
          <div style={{ background: "rgba(255, 69, 58, 0.15)", border: "1px solid #ff453a", color: "#ff453a", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
            <p style={{ fontWeight: 600, margin: "0 0 8px 0", fontSize: "14px" }}>⚠️ This task was updated by another team member.</p>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", opacity: 0.9 }}>Your changes have <strong>not</strong> been saved. Your unsaved changes are still here.</p>
            <Button variant="danger" onClick={onReloadLatest} style={{ fontSize: "12px", padding: "6px 12px" }}>Reload Latest</Button>
          </div>
        )}
        <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>{task.title}</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px", alignItems: "center" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: "500" }}>Status</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.status} 
                onChange={(e) => onUpdate(task._id, { status: e.target.value })}
                style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "4px", padding: "4px 8px", color: "var(--color-text-dark)", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: "500" }}>Assignee</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.assignedTo?._id || task.assignedTo || ""} 
                onChange={(e) => onUpdate(task._id, { assignedTo: e.target.value })}
                style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "4px", padding: "4px 8px", color: "var(--color-text-dark)", fontSize: "13px" }}
              >
                <option value="">Unassigned</option>
                {teamSorted.map(m => <option key={m?.userId?._id} value={m?.userId?._id}>{m?.userId?.name}</option>)}
              </select>
            </div>

            <div style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: "500" }}>Priority</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.priority} 
                onChange={(e) => onUpdate(task._id, { priority: e.target.value })}
                style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "4px", padding: "4px 8px", color: "var(--color-text-dark)", fontSize: "13px" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: "500" }}>Release</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.releaseId || ""} 
                onChange={(e) => onUpdate(task._id, { releaseId: e.target.value || null })}
                style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "4px", padding: "4px 8px", color: "var(--color-text-dark)", fontSize: "13px" }}
              >
                <option value="">None</option>
                {releases.map(r => <option key={r._id} value={r._id}>{r.version}</option>)}
              </select>
            </div>
            
            <div style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: "500" }}>Dates</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border-medium)", margin: "8px 0" }} />

          {/* Description */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Description</h3>
            <textarea 
              placeholder="Add a description..."
              defaultValue={task.description}
              onBlur={(e) => {
                if (e.target.value !== task.description) {
                   onUpdate(task._id, { description: e.target.value });
                }
              }}
              style={{ width: "100%", height: "150px", background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "6px", padding: "12px", color: "var(--color-text-dark)", resize: "vertical", outline: "none", fontSize: "14px" }}
            />
          </div>
          
          <hr style={{ border: "none", borderTop: "1px solid var(--color-border-medium)", margin: "8px 0" }} />
          
          {/* Activity / Comments Placeholder */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Activity</h3>
            <div style={{ color: "var(--color-text-muted)", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "32px 0", background: "var(--color-border-subtle)", borderRadius: "8px" }}>
              Comments and history coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
