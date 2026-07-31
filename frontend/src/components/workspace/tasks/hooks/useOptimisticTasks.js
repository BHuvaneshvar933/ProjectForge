import { useCallback, useRef } from "react";
import { updateTaskStatus, updateTask } from "../../../../api/taskApi";
import { toast } from "react-toastify";

export function useOptimisticTasks(tasks, setTasks) {
  // Keep track of original tasks for rollback
  const originalTasksRef = useRef({});

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
      if (updates.status && Object.keys(updates).length === 1) {
        await updateTaskStatus(taskId, updates.status);
      } else {
        await updateTask(taskId, updates);
      }
      
      // Clear from history if successful
      delete originalTasksRef.current[taskId];
      
      // Optionally re-fetch to ensure complete sync
      // await fetchTasks(); 
    } catch (e) {
      console.error("Task update failed", e);
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

  return { optimisticUpdate };
}
