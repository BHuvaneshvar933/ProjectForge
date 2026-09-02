import { useCallback, useRef } from "react";
import { updateTaskStatus, updateTask } from "../../../../api/taskApi";
import { toast } from "react-toastify";

export function useOptimisticTasks(tasks, setTasks) {
  // Keep track of original tasks for rollback
  const originalTasksRef = useRef({});
  const [conflicts, setConflicts] = useState({});

  const optimisticUpdate = useCallback(async (taskId, updates) => {
    const taskIndex = tasks.findIndex((t) => t._id === taskId);
    if (taskIndex === -1) return;

    const originalTask = tasks[taskIndex];
    originalTasksRef.current[taskId] = originalTask;

    // Apply locally
    setTasks(prev => {
      const next = [...prev];
      next[taskIndex] = { ...next[taskIndex], ...updates };
      return next;
    });

    try {
      let response;
      if (updates.status && Object.keys(updates).length === 1) {
        response = await updateTaskStatus(taskId, updates.status, originalTask.__v);
      } else {
        response = await updateTask(taskId, { ...updates, __v: originalTask.__v });
      }
      
      // Update local state with the exact server response (which has new __v)
      if (response && response.data && response.data.data) {
        const serverTask = response.data.data;
        setTasks(prev => {
          const next = [...prev];
          const i = next.findIndex(t => t._id === taskId);
          if (i !== -1) {
            next[i] = { ...next[i], ...serverTask };
          }
          return next;
        });
      }

      // Clear from history if successful
      delete originalTasksRef.current[taskId];
      
      // Clear any previous conflict
      setConflicts(prev => {
        if (!prev[taskId]) return prev;
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      
    } catch (e) {
      console.error("Task update failed", e);
      
      if (e.response && e.response.status === 409) {
        // 409 Conflict: Do NOT rollback automatically. Let the user keep their unsaved changes.
        setConflicts(prev => ({ ...prev, [taskId]: true }));
        return; // Exit early without rolling back
      }
      
      toast.error("Failed to update task");
      
      // Rollback
      const previousState = originalTasksRef.current[taskId];
      if (previousState) {
        setTasks(prev => {
          const next = [...prev];
          const i = next.findIndex(t => t._id === taskId);
          if (i !== -1) {
            next[i] = previousState;
          }
          return next;
        });
        delete originalTasksRef.current[taskId];
      }
    }
  }, [tasks, setTasks]);

  const clearConflict = useCallback((taskId) => {
    setConflicts(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  return { optimisticUpdate, conflicts, clearConflict };
}
