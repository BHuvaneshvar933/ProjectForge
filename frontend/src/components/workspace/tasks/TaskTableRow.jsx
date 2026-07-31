import React, { useState } from "react";
import { Bug, Bookmark, CheckSquare, Zap, Target, ChevronRight, ChevronDown } from "lucide-react";

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
      case "epic": 
        return <div style={{ background: "rgba(191, 90, 242, 0.15)", color: "#bf5af2", padding: "4px", borderRadius: "4px", display: "flex" }}><Zap size={14} /></div>;
      case "story": 
        return <div style={{ background: "rgba(50, 215, 75, 0.15)", color: "#32d74b", padding: "4px", borderRadius: "4px", display: "flex" }}><Bookmark size={14} /></div>;
      case "bug": 
        return <div style={{ background: "rgba(255, 69, 58, 0.15)", color: "#ff453a", padding: "4px", borderRadius: "4px", display: "flex" }}><Bug size={14} /></div>;
      case "feature": 
        return <div style={{ background: "rgba(10, 132, 255, 0.15)", color: "#0a84ff", padding: "4px", borderRadius: "4px", display: "flex" }}><Target size={14} /></div>;
      case "sub-task": 
      default: 
        return <div style={{ background: "rgba(94, 92, 230, 0.15)", color: "#5e5ce6", padding: "4px", borderRadius: "4px", display: "flex" }}><CheckSquare size={14} /></div>;
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
            <span title={task.issueType}>{getIssueIcon(task.issueType)}</span>
          </div>
        );
      case "key":
        return (
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onClickRow(task); }} 
            style={{ 
              color: "rgba(255,255,255,0.7)", 
              textDecoration: "none", 
              fontWeight: "500", 
              fontSize: "12px",
              letterSpacing: "0.02em",
              transition: "color 0.15s ease"
            }}
            onMouseOver={(e) => e.target.style.color = "#ffffff"}
            onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.7)"}
          >
            {project?.key || "TASK"}-{task.taskNumber}
          </a>
        );
      case "title":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
            {level > 0 && (
              <span style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: "14px", userSelect: "none" }}>
                └─
              </span>
            )}
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
        alignItems: "center",
        marginLeft: `${level * 24}px`,
        width: `calc(100% - ${level * 24}px)`,
        borderLeft: level > 0 ? "2px solid rgba(255,255,255,0.2)" : "none"
      }}
    >
      {/* Fixed first column: Expand & Checkbox */}
      <div style={{ display: "flex", alignItems: "center", width: "40px", paddingLeft: "8px", flexShrink: 0 }}>
        {hasChildren ? (
          <button 
            onClick={onToggleExpand}
            style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", borderRadius: "4px", padding: 0 }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div style={{ width: "20px" }}></div>
        )}
        
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => onToggleSelection(task._id, e.nativeEvent)}
          style={{ marginLeft: "4px", cursor: "pointer", accentColor: "#ffffff", width: "14px", height: "14px" }}
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
            paddingLeft: 12,
            overflow: "hidden"
          }}
        >
          {renderCell(column)}
        </div>
      ))}
    </div>
  );
}
