import { useState, useMemo } from "react";

export function useTaskFilters(tasks) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    status: [], // e.g. ["todo", "in-progress"]
    priority: [], // e.g. ["high"]
    assignee: [],
    type: [] // e.g. ["epic", "story"]
  });

  const toggleFilter = (category, value) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ status: [], priority: [], assignee: [], type: [] });
    setSearch("");
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search
      if (search) {
        const query = search.toLowerCase();
        const matchesKey = task.taskNumber && `task-${task.taskNumber}`.toLowerCase().includes(query);
        const matchesTitle = task.title?.toLowerCase().includes(query);
        if (!matchesKey && !matchesTitle) return false;
      }

      // Status
      if (activeFilters.status.length > 0 && !activeFilters.status.includes(task.status)) return false;
      
      // Priority
      if (activeFilters.priority.length > 0 && !activeFilters.priority.includes(task.priority)) return false;
      
      // Assignee
      if (activeFilters.assignee.length > 0) {
        const assignedId = task.assignedTo?._id || task.assignedTo || "unassigned";
        if (!activeFilters.assignee.includes(assignedId)) return false;
      }
      
      // Type
      if (activeFilters.type.length > 0 && !activeFilters.type.includes(task.issueType)) return false;

      return true;
    });
  }, [tasks, search, activeFilters]);

  // Hierarchical flattened generation:
  // If we are filtering, we often just want a flat list, but Jira usually maintains hierarchy if parents match, 
  // or flattens it out if deep items match but parents don't.
  // For simplicity, we will return the flat filtered tasks. 
  // The presentation layer (TasksTable) will decide how to render them.

  return {
    search,
    setSearch,
    activeFilters,
    toggleFilter,
    clearFilters,
    filteredTasks
  };
}
