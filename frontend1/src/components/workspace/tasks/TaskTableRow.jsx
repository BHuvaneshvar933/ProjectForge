import React, { useState } from "react";

export default function TaskTableRow({ 
  task, 
  project,
  teamSorted,
  visibleColumns, 
  isSelected, 
  onToggleSelection, 
  onOptimisticUpdate,
  level = 0, // 0: Epic, 1: Story, 2: Sub-task
  hasChildren,
  isExpanded,
  onToggleExpand,
  onClickRow
}) {
  const [hovered, setHovered] = useState(false);

  // For inline text edits
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);

  const getIssueIcon = (type) => {
    switch (type) {
      case "epic": return "🟣";
      case "story": return "📗";
      case "bug": return "🐛";
      case "feature": return "✨";
      case "sub-task": return "🔲";
      default: return "📝";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ff453a";
      case "medium": return "#ff9f0a";
      default: return "#32d74b";
    }
  };

  const handleTitleSubmit = () => {
    if (titleValue.trim() && titleValue !== task.title) {
      onOptimisticUpdate(task._id, { title: titleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") handleTitleSubmit();
    if (e.key === "Escape") {
      setTitleValue(task.title);
      setIsEditingTitle(false);
    }
  };

  const renderCell = (column) => {
    const commonSelectStyle = {
      padding: "4px 8px", 
      fontSize: "13px", 
      height: "auto", 
      background: hovered ? "rgba(255,255,255,0.05)" : "transparent",
      border: hovered ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
      borderRadius: "4px",
      color: "#fff",
      cursor: "pointer",
      width: "100%",
      appearance: hovered ? "auto" : "none"
    };

    switch (column.id) {
      case "type":
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span title={task.issueType} style={{ fontSize: "16px" }}>{getIssueIcon(task.issueType)}</span>
          </div>
        );
      case "key":
        return (
          <a href="#" onClick={(e) => { e.preventDefault(); onClickRow(task); }} style={{ color: "#0a84ff", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
            {project?.key || "TASK"}-{task.taskNumber}
          </a>
        );
      case "title":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
            {isEditingTitle ? (
              <input 
                autoFocus
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid #0a84ff", color: "#fff", padding: "2px 6px", borderRadius: "4px", outline: "none", fontSize: "14px" }}
              />
            ) : (
              <span 
                onDoubleClick={() => setIsEditingTitle(true)}
                style={{ fontWeight: task.issueType === "epic" ? "600" : "500", cursor: "text", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {task.title}
              </span>
            )}
          </div>
        );
      case "status":
        return (
          <select 
            value={task.status} 
            onChange={(e) => onOptimisticUpdate(task._id, { status: e.target.value })}
            style={{ ...commonSelectStyle, fontWeight: "600", textTransform: "uppercase", fontSize: "11px" }}
          >
            <option value="todo">TO DO</option>
            <option value="in-progress">IN PROGRESS</option>
            <option value="done">DONE</option>
          </select>
        );
      case "priority":
        return (
          <select 
            value={task.priority} 
            onChange={(e) => onOptimisticUpdate(task._id, { priority: e.target.value })}
            style={{ ...commonSelectStyle, color: getPriorityColor(task.priority), fontWeight: "600" }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        );
      case "assignedTo":
        return (
          <select 
            value={task.assignedTo?._id || task.assignedTo || ""} 
            onChange={(e) => onOptimisticUpdate(task._id, { assignedTo: e.target.value })}
            style={commonSelectStyle}
          >
            <option value="">Unassigned</option>
            {teamSorted.map(m => <option key={m?.userId?._id} value={m?.userId?._id}>{m?.userId?.name || "Member"}</option>)}
          </select>
        );
      case "updatedAt":
        return <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{new Date(task.updatedAt).toLocaleDateString()}</span>;
      case "dueDate":
        return <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</span>;
      case "actions":
        return (
          <button style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            •••
          </button>
        );
      default:
        return null;
    }
  };

  const paddingLeft = level * 24 + 16; // Indent based on hierarchy level

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        display: "flex", 
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: isSelected ? "rgba(10, 132, 255, 0.15)" : hovered ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.1s ease",
        height: "40px",
        alignItems: "center"
      }}
    >
      {/* Fixed first column: Expand & Checkbox */}
      <div style={{ display: "flex", alignItems: "center", width: "40px", paddingLeft: "8px", flexShrink: 0 }}>
        {hasChildren ? (
          <button 
            onClick={onToggleExpand}
            style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", borderRadius: "4px" }}
            onMouseOver={e => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={e => e.target.style.background = "transparent"}
          >
            {isExpanded ? "v" : ">"}
          </button>
        ) : (
          <div style={{ width: "20px" }}></div>
        )}
        
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => onToggleSelection(task._id, e.nativeEvent)}
          style={{ marginLeft: "4px", cursor: "pointer" }}
        />
      </div>

      {/* Dynamic Columns */}
      {visibleColumns.map(column => (
        <div 
          key={column.id} 
          style={{ 
            width: column.width, 
            minWidth: column.width, 
            padding: "0 12px", 
            display: "flex", 
            alignItems: "center",
            paddingLeft: column.id === "title" ? paddingLeft : 12,
            overflow: "hidden"
          }}
        >
          {renderCell(column)}
        </div>
      ))}
    </div>
  );
}
