import React, { useEffect, useRef } from "react";

export default function TasksContextMenu({ x, y, task, onClose, onDelete, onUpdateStatus, onAssign, teamSorted }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Slight delay to avoid immediate close on right click
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
    }, 10);
    
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [onClose]);

  if (!task) return null;

  const btnStyle = { width: "100%", textAlign: "left", padding: "8px 16px", background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "14px" };
  const hoverStyle = (e) => e.target.style.background = "rgba(255,255,255,0.1)";
  const outStyle = (e) => e.target.style.background = "transparent";

  return (
    <div 
      ref={menuRef}
      style={{
        position: "fixed",
        top: Math.min(y, window.innerHeight - 200), // prevent going off screen bottom
        left: Math.min(x, window.innerWidth - 200), // prevent going off screen right
        width: "200px",
        background: "#2c2c2e",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 2000,
        padding: "8px 0"
      }}
    >
      <div style={{ padding: "4px 16px", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>
        Actions ({task.taskNumber})
      </div>
      
      <button 
        style={btnStyle} 
        onMouseOver={hoverStyle} onMouseOut={outStyle}
        onClick={() => { onUpdateStatus(task._id, "done"); onClose(); }}
      >
        Mark as Done
      </button>
      
      <button 
        style={btnStyle} 
        onMouseOver={hoverStyle} onMouseOut={outStyle}
        onClick={() => { onAssign(task._id, null /* assuming current user if possible, but let's just use empty */); onClose(); }}
      >
        Unassign
      </button>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0" }}></div>
      
      <button 
        style={{ ...btnStyle, color: "#ff453a" }} 
        onMouseOver={e => e.target.style.background = "rgba(255,69,58,0.1)"} 
        onMouseOut={outStyle}
        onClick={() => {
          if (confirm("Are you sure you want to delete this task?")) {
            onDelete(task._id);
          }
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}
