import React, { useState } from "react";
import Input from "../../common/Input";

export default function TasksToolbar({ 
  search, 
  setSearch, 
  activeFilters, 
  toggleFilter, 
  clearFilters, 
  columns, 
  toggleColumnVisibility, 
  resetColumns 
}) {
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  const filterCount = Object.values(activeFilters).flat().length;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "240px" }}>
          <Input 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        

        <select 
          className="workspace-select" 
          onChange={(e) => toggleFilter("type", e.target.value)}
          value=""
          style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "6px", padding: "8px 12px", color: "var(--color-text-dark)", fontSize: "14px" }}
        >
          <option value="" disabled>Type</option>
          <option value="epic">Epic</option>
          <option value="story">Story</option>
          <option value="task">Task</option>
          <option value="bug">Bug</option>
        </select>

        <select 
          className="workspace-select" 
          onChange={(e) => toggleFilter("status", e.target.value)}
          value=""
          style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", borderRadius: "6px", padding: "8px 12px", color: "var(--color-text-dark)", fontSize: "14px" }}
        >
          <option value="" disabled>Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {filterCount > 0 && (
          <button 
            onClick={clearFilters}
            style={{ background: "transparent", border: "none", color: "#0a84ff", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
        <button 
          onClick={() => setShowColumnsMenu(!showColumnsMenu)}
          style={{ background: "var(--color-border-subtle)", border: "1px solid var(--color-border-medium)", color: "var(--color-text-dark)", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
        >
          Columns ▾
        </button>
        
        {showColumnsMenu && (
          <div style={{ position: "absolute", top: "100%", right: "0", marginTop: "4px", background: "#1c1c1e", border: "1px solid var(--color-border-medium)", borderRadius: "8px", padding: "8px", zIndex: 100, minWidth: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "4px 8px", fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
              Show Columns
            </div>
            {columns.map(c => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", cursor: "pointer", fontSize: "14px" }}>
                <input 
                  type="checkbox" 
                  checked={c.visible} 
                  onChange={() => toggleColumnVisibility(c.id)}
                />
                {c.label || "Actions"}
              </label>
            ))}
            <div style={{ borderTop: "1px solid var(--color-border-medium)", margin: "8px 0" }}></div>
            <button 
              onClick={resetColumns}
              style={{ width: "100%", background: "transparent", border: "none", color: "#0a84ff", cursor: "pointer", fontSize: "13px", padding: "6px", textAlign: "left" }}
            >
              Reset to default
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
