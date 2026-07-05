import { useState, useEffect, useCallback } from "react";

const DEFAULT_COLUMNS = [
  { id: "type", label: "Type", width: 60, visible: true },
  { id: "key", label: "Key", width: 100, visible: true },
  { id: "title", label: "Title", width: 400, visible: true },
  { id: "status", label: "Status", width: 140, visible: true },
  { id: "priority", label: "Priority", width: 120, visible: true },
  { id: "assignedTo", label: "Assignee", width: 160, visible: true },
  { id: "updatedAt", label: "Updated", width: 120, visible: true },
  { id: "dueDate", label: "Due", width: 120, visible: false },
  { id: "actions", label: "", width: 60, visible: true }, // right side actions
];

export function useColumnManagement(projectId) {
  const storageKey = `projectforge_columns_${projectId}`;
  
  const [columns, setColumns] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to catch missing columns
        return DEFAULT_COLUMNS.map(dc => {
          const found = parsed.find(pc => pc.id === dc.id);
          return found ? { ...dc, ...found } : dc;
        });
      }
    } catch (e) {
      console.warn("Could not load columns from local storage", e);
    }
    return DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [columns, storageKey]);

  const toggleColumnVisibility = useCallback((columnId) => {
    setColumns(prev => prev.map(c => 
      c.id === columnId ? { ...c, visible: !c.visible } : c
    ));
  }, []);

  const resizeColumn = useCallback((columnId, newWidth) => {
    setColumns(prev => prev.map(c =>
      c.id === columnId ? { ...c, width: Math.max(50, newWidth) } : c
    ));
  }, []);

  const reorderColumns = useCallback((activeId, overId) => {
    setColumns(prev => {
      const oldIndex = prev.findIndex(c => c.id === activeId);
      const newIndex = prev.findIndex(c => c.id === overId);
      
      const newArray = [...prev];
      const [movedItem] = newArray.splice(oldIndex, 1);
      newArray.splice(newIndex, 0, movedItem);
      
      return newArray;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setColumns(DEFAULT_COLUMNS);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    columns,
    visibleColumns: columns.filter(c => c.visible),
    toggleColumnVisibility,
    resizeColumn,
    reorderColumns,
    resetColumns
  };
}
