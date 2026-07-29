import React, { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import TaskTableRow from "./TaskTableRow";

export default function TasksTable({ 
  tasks, // these should be flat and pre-filtered
  project,
  teamSorted,
  visibleColumns,
  selectedIds,
  onToggleSelection,
  onOptimisticUpdate,
  expandedEpics,
  onToggleExpand,
  onClickRow,
  inlineCreateParent,
  setInlineCreateParent,
  inlineCreateTitle,
  setInlineCreateTitle,
  inlineCreateType,
  setInlineCreateType,
  onInlineCreate,
  taskCreating
}) {
  const parentRef = useRef(null);

  // Flatten the hierarchy based on expansion state
  const visibleTasks = useMemo(() => {
    const flat = [];
    
    // Get all top level items (Epics, and standalones)
    const epics = tasks.filter(t => !t.parentId && t.issueType === "epic");
    const standalones = tasks.filter(t => !t.parentId && t.issueType !== "epic");

    // Helper to add subtasks for a given task
    const addSubTasks = (parentTaskId, level) => {
      const subs = tasks.filter(t => t.parentId === parentTaskId);
      subs.forEach(sub => {
        flat.push({ task: sub, level, hasChildren: false });
      });
    };

    // 1. Process Epics
    epics.forEach(epic => {
      const isExpanded = expandedEpics[epic._id] !== false; // default true
      const children = tasks.filter(t => t.parentId === epic._id);
      
      flat.push({ task: epic, level: 0, hasChildren: children.length > 0, isExpanded });
      
      if (isExpanded) {
        children.forEach(child => {
          const subTasks = tasks.filter(t => t.parentId === child._id);
          flat.push({ task: child, level: 1, hasChildren: subTasks.length > 0, isExpanded: expandedEpics[child._id] !== false });
          
          if (expandedEpics[child._id] !== false) {
             addSubTasks(child._id, 2);
             // Create sub-task under a child
             flat.push({ isCreateRow: true, parentId: child._id, parentType: child.issueType, level: 2 });
          }
        });
        
        // Create story/task/bug under an Epic
        flat.push({ isCreateRow: true, parentId: epic._id, parentType: "epic", level: 1 });
      }
    });

    // 2. Process Standalone tasks (Stories/Tasks not under epic)
    standalones.forEach(standalone => {
      const isExpanded = expandedEpics[standalone._id] !== false;
      const subTasks = tasks.filter(t => t.parentId === standalone._id);
      
      flat.push({ task: standalone, level: 0, hasChildren: subTasks.length > 0, isExpanded });
      
      if (isExpanded) {
        addSubTasks(standalone._id, 1);
        
        // Create sub-task under a standalone task
        flat.push({ isCreateRow: true, parentId: standalone._id, parentType: standalone.issueType, level: 1 });
      }
    });

    return flat;
  }, [tasks, expandedEpics]);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: visibleTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // 40px row height
    overscan: 5,
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", margin: "0 16px" }}>
      {/* Table Header */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)", height: "40px", alignItems: "center" }}>
        <div style={{ width: "40px", paddingLeft: "8px", flexShrink: 0 }}></div>
        {visibleColumns.map(column => (
          <div key={column.id} style={{ width: column.width, minWidth: column.width, padding: "0 12px", fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
            {column.label}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div ref={parentRef} style={{ flex: 1, overflow: "auto" }}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const item = visibleTasks[virtualItem.index];
            
            if (item.isCreateRow) {
              const paddingLeft = item.level * 24 + 16 + 28; // align with text
              return (
                <div
                  key={`create-${item.parentId}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft,
                    borderBottom: "1px solid rgba(255,255,255,0.02)",
                  }}
                >
                  {inlineCreateParent === item.parentId ? (
                    <div 
                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", paddingRight: "16px" }}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          if (!inlineCreateTitle) setInlineCreateParent(null);
                        }
                      }}
                    >
                      <select 
                        value={inlineCreateType}
                        onChange={(e) => setInlineCreateType(e.target.value)}
                        style={{ 
                          background: "rgba(255,255,255,0.1)", 
                          border: "1px solid rgba(255,255,255,0.1)", 
                          borderRadius: "4px", 
                          color: "#fff", 
                          padding: "4px 8px",
                          outline: "none",
                          fontSize: "13px"
                        }}
                      >
                        {item.parentType === "epic" ? (
                          <>
                            <option value="story">Story</option>
                            <option value="task">Task</option>
                            <option value="bug">Bug</option>
                          </>
                        ) : (
                          <option value="sub-task">Sub-task</option>
                        )}
                      </select>

                      <input
                        autoFocus
                        type="text"
                        placeholder="What needs to be done?"
                        value={inlineCreateTitle}
                        onChange={e => setInlineCreateTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") onInlineCreate(item.parentId);
                          if (e.key === "Escape") setInlineCreateParent(null);
                        }}
                        disabled={taskCreating}
                        style={{ 
                          flex: 1, 
                          padding: "4px 12px", 
                          background: "rgba(255,255,255,0.05)", 
                          border: "1px solid #0a84ff", 
                          borderRadius: "4px", 
                          color: "#fff", 
                          outline: "none", 
                          fontSize: "13px",
                          opacity: taskCreating ? 0.5 : 1
                        }}
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setInlineCreateParent(item.parentId);
                        setInlineCreateTitle("");
                        setInlineCreateType(item.parentType === "epic" ? "story" : "sub-task");
                      }}
                      style={{ 
                        background: "transparent", 
                        border: "none", 
                        color: "#0a84ff", 
                        cursor: "pointer", 
                        fontSize: "13px", 
                        fontWeight: "500", 
                        padding: "4px 8px", 
                        borderRadius: "4px" 
                      }}
                      onMouseOver={(e) => e.target.style.background = "rgba(10,132,255,0.1)"}
                      onMouseOut={(e) => e.target.style.background = "transparent"}
                    >
                      + Create child issue
                    </button>
                  )}
                </div>
              );
            }

            const { task, level, hasChildren, isExpanded } = item;
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <TaskTableRow 
                  task={task}
                  project={project}
                  teamSorted={teamSorted}
                  visibleColumns={visibleColumns}
                  isSelected={selectedIds.has(task._id)}
                  onToggleSelection={onToggleSelection}
                  onOptimisticUpdate={onOptimisticUpdate}
                  level={level}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  onToggleExpand={() => onToggleExpand(task._id)}
                  onClickRow={onClickRow}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
