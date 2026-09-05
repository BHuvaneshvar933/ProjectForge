import React from "react";

export default function BulkActionBar({ selectedCount, onClear, onDelete, onUpdateStatus, onAssign, teamSorted }) {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "32px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#2c2c2e",
      border: "1px solid var(--color-border-medium)",
      borderRadius: "12px",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "24px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      zIndex: 1000
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ background: "#0a84ff", color: "var(--color-text-dark)", padding: "2px 8px", borderRadius: "12px", fontSize: "14px", fontWeight: "600" }}>
          {selectedCount}
        </span>
        <span style={{ color: "var(--color-text-dark)", fontWeight: "500", fontSize: "14px" }}>issues selected</span>
      </div>

      <div style={{ width: "1px", height: "24px", background: "var(--color-border-medium)" }}></div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <select 
          className="workspace-select" 
          onChange={(e) => {
            if (e.target.value) {
              onUpdateStatus(e.target.value);
              e.target.value = "";
            }
          }}
          style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "6px", padding: "6px 12px", color: "var(--color-text-dark)", fontSize: "13px" }}
        >
          <option value="">Status...</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select 
          className="workspace-select" 
          onChange={(e) => {
            if (e.target.value !== undefined) {
              onAssign(e.target.value === "unassigned" ? null : e.target.value);
              e.target.value = "";
            }
          }}
          style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "6px", padding: "6px 12px", color: "var(--color-text-dark)", fontSize: "13px" }}
        >
          <option value="">Assignee...</option>
          <option value="unassigned">Unassigned</option>
          {teamSorted.map(m => <option key={m?.userId?._id} value={m?.userId?._id}>{m?.userId?.name}</option>)}
        </select>

        <button 
          onClick={() => {
            if (confirm("Are you sure you want to delete these tasks?")) {
              onDelete();
            }
          }}
          style={{ background: "transparent", border: "1px solid #ff453a", color: "#ff453a", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
          onMouseOver={e => e.target.style.background = "rgba(255,69,58,0.1)"}
          onMouseOut={e => e.target.style.background = "transparent"}
        >
          Delete
        </button>
      </div>

      <div style={{ width: "1px", height: "24px", background: "var(--color-border-medium)" }}></div>

      <button 
        onClick={onClear}
        style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "20px" }}
        title="Clear selection"
      >
        ×
      </button>
    </div>
  );
}
