import React from "react";
import Input from "../../common/Input";
import Button from "../../common/Button";

export default function TaskDetailsDrawer({ task, project, teamSorted, onClose, onUpdate }) {
  if (!task) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "500px",
      height: "100vh",
      background: "#1c1c1e",
      borderLeft: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      transform: "translateX(0)",
      transition: "transform 0.3s ease"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a href="#" style={{ color: "#0a84ff", textDecoration: "none", fontWeight: "600" }}>{project?.key}-{task.taskNumber}</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "16px" }}>•••</button>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "20px" }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>{task.title}</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px", alignItems: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "500" }}>Status</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.status} 
                onChange={(e) => onUpdate(task._id, { status: e.target.value })}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "4px 8px", color: "#fff", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "500" }}>Assignee</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.assignedTo?._id || task.assignedTo || ""} 
                onChange={(e) => onUpdate(task._id, { assignedTo: e.target.value })}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "4px 8px", color: "#fff", fontSize: "13px" }}
              >
                <option value="">Unassigned</option>
                {teamSorted.map(m => <option key={m?.userId?._id} value={m?.userId?._id}>{m?.userId?.name}</option>)}
              </select>
            </div>

            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "500" }}>Priority</div>
            <div>
              <select 
                className="workspace-select" 
                value={task.priority} 
                onChange={(e) => onUpdate(task._id, { priority: e.target.value })}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "4px 8px", color: "#fff", fontSize: "13px" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: "500" }}>Dates</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0" }} />

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
              style={{ width: "100%", height: "150px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "12px", color: "#fff", resize: "vertical", outline: "none", fontSize: "14px" }}
            />
          </div>
          
          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0" }} />
          
          {/* Activity / Comments Placeholder */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Activity</h3>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "32px 0", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
              Comments and history coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
