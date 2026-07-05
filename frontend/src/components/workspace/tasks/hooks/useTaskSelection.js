import { useState, useCallback } from "react";

export function useTaskSelection(tasks) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  const toggleSelection = useCallback((taskId, event) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      
      if (event?.shiftKey && lastSelectedId) {
        // Find indices in the current visible list
        // Note: tasks passed here should be the *flattened, visible* list
        const startIndex = tasks.findIndex(t => t._id === lastSelectedId);
        const endIndex = tasks.findIndex(t => t._id === taskId);
        
        if (startIndex !== -1 && endIndex !== -1) {
          const min = Math.min(startIndex, endIndex);
          const max = Math.max(startIndex, endIndex);
          
          for (let i = min; i <= max; i++) {
            next.add(tasks[i]._id);
          }
        }
      } else if (event?.metaKey || event?.ctrlKey) {
        // Toggle single
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
      } else {
        // Normal click behavior depending on how we want it
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
      }
      
      return next;
    });

    setLastSelectedId(taskId);
  }, [tasks, lastSelectedId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(tasks.map(t => t._id)));
  }, [tasks]);

  return {
    selectedIds,
    toggleSelection,
    clearSelection,
    selectAll,
    hasSelection: selectedIds.size > 0
  };
}
