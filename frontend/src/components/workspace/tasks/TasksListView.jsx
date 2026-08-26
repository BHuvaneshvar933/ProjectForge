import React, { useState } from "react";
import TasksToolbar from "./TasksToolbar";
import TasksTable from "./TasksTable";
import TaskDetailsDrawer from "./TaskDetailsDrawer";
import BulkActionBar from "./BulkActionBar";
import { useTaskSelection } from "./hooks/useTaskSelection";
import { useColumnManagement } from "./hooks/useColumnManagement";
import { useTaskFilters } from "./hooks/useTaskFilters";
import { useOptimisticTasks } from "./hooks/useOptimisticTasks";
import { toast } from "react-toastify";
import { createTask, bulkUpdateTasks, deleteTask } from "../../../api/taskApi";

export default function TasksListView({ projectId, project, initialTasks, teamSorted, fetchTasks, releases }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedEpics, setExpandedEpics] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);

  const [inlineCreateParent, setInlineCreateParent] = useState(null);
  const [inlineCreateTitle, setInlineCreateTitle] = useState("");
  const [inlineCreateType, setInlineCreateType] = useState("story");
  const [taskCreating, setTaskCreating] = useState(false);

  // Keep tasks synced if props change
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const { optimisticUpdate } = useOptimisticTasks(tasks, setTasks, fetchTasks);
  const { search, setSearch, activeFilters, toggleFilter, clearFilters, filteredTasks } = useTaskFilters(tasks, teamSorted);
  const { columns, visibleColumns, toggleColumnVisibility, resetColumns } = useColumnManagement(projectId);
  const { selectedIds, toggleSelection, clearSelection } = useTaskSelection(filteredTasks);

  const handleToggleExpand = (taskId) => {
    setExpandedEpics(prev => ({ ...prev, [taskId]: prev[taskId] === false }));
  };

  const handleInlineCreate = async (parentId) => {
    if (!inlineCreateTitle.trim()) return;
    setTaskCreating(true);
    try {
      await createTask(projectId, {
        title: inlineCreateTitle.trim(),
        description: "",
        priority: "medium",
        issueType: inlineCreateType,
        parentId: parentId,
      });
      setInlineCreateTitle("");
      setInlineCreateParent(null);
      toast.success("Task created");
      fetchTasks();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setTaskCreating(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkUpdateTasks(projectId, { action: "delete", taskIds: Array.from(selectedIds) });
      toast.success("Tasks deleted");
      clearSelection();
      fetchTasks();
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    try {
      await bulkUpdateTasks(projectId, { action: "update", taskIds: Array.from(selectedIds), payload: { status } });
      toast.success(`Updated status for ${selectedIds.size} tasks`);
      clearSelection();
      fetchTasks();
    } catch {
      toast.error("Bulk update failed");
    }
  };

  const handleBulkAssign = async (assignee) => {
    try {
      await bulkUpdateTasks(projectId, { action: "update", taskIds: Array.from(selectedIds), payload: { assignedTo: assignee } });
      toast.success(`Assigned ${selectedIds.size} tasks`);
      clearSelection();
      fetchTasks();
    } catch {
      toast.error("Bulk assignment failed");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
      setSelectedTask(null);
      fetchTasks();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", position: "relative" }}>
      <TasksToolbar 
        search={search}
        setSearch={setSearch}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        team={teamSorted}
        columns={columns}
        toggleColumnVisibility={toggleColumnVisibility}
        resetColumns={resetColumns}
      />

      <TasksTable 
        tasks={filteredTasks}
        project={project}
        teamSorted={teamSorted}
        visibleColumns={visibleColumns}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onOptimisticUpdate={optimisticUpdate}
        expandedEpics={expandedEpics}
        onToggleExpand={handleToggleExpand}
        onClickRow={setSelectedTask}
        inlineCreateParent={inlineCreateParent}
        setInlineCreateParent={setInlineCreateParent}
        inlineCreateTitle={inlineCreateTitle}
        setInlineCreateTitle={setInlineCreateTitle}
        inlineCreateType={inlineCreateType}
        setInlineCreateType={setInlineCreateType}
        onInlineCreate={handleInlineCreate}
        taskCreating={taskCreating}
      />

      <BulkActionBar 
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onUpdateStatus={handleBulkUpdateStatus}
        onAssign={handleBulkAssign}
        teamSorted={teamSorted}
      />

      {selectedTask && (
        <TaskDetailsDrawer 
          task={tasks.find(t => t._id === selectedTask._id) || selectedTask} 
          project={project}
          teamSorted={teamSorted}
          releases={releases}
          onClose={() => setSelectedTask(null)}
          onUpdate={optimisticUpdate}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
