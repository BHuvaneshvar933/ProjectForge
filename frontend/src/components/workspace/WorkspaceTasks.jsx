import React, { useState, useMemo } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Spinner from "../common/Spinner";
import { toast } from "react-toastify";
import { createTask, updateTaskStatus, assignTask } from "../../api/taskApi";
import TasksListView from "./tasks/TasksListView";

export default function WorkspaceTasks({ projectId, project, tasks, teamSorted, tasksLoading, onTaskChange, fetchTasks }) {
  const [taskView, setTaskView] = useState("board");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskCreating, setTaskCreating] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    issueType: "task",
    parentId: "",
    assignedTo: "",
    startedAt: "",
    dueDate: "",
  });
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [expandedEpics, setExpandedEpics] = useState({});
  const [inlineCreateParent, setInlineCreateParent] = useState(null);
  const [inlineCreateTitle, setInlineCreateTitle] = useState("");

  const isCompleted = project?.status === "completed";

  const handleInlineCreate = async (parentId, defaultType) => {
    if (!inlineCreateTitle.trim()) return;
    setTaskCreating(true);
    try {
      await createTask(projectId, {
        title: inlineCreateTitle.trim(),
        description: "",
        priority: "medium",
        issueType: defaultType,
        parentId: parentId,
      });
      setInlineCreateTitle("");
      setInlineCreateParent(null);
      toast.success("Task created");
      fetchTasks();
    } catch (e) {
      toast.error("Failed to create task");
    } finally {
      setTaskCreating(false);
    }
  };

  const toggleEpic = (epicId) => {
    setExpandedEpics(prev => ({ ...prev, [epicId]: prev[epicId] === false }));
  };

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      "in-progress": tasks.filter((t) => t.status === "in-progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const onChangeTaskForm = (key, value) => {
    setTaskForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "issueType") {
        if (value === "epic") {
          next.parentId = "";
        } else if (value === "sub-task") {
          const parent = tasks.find(t => t._id === next.parentId);
          if (!parent || parent.issueType === "epic") next.parentId = "";
        } else {
          const parent = tasks.find(t => t._id === next.parentId);
          if (!parent || parent.issueType !== "epic") next.parentId = "";
        }
      }
      return next;
    });
  };

  const onCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setTaskCreating(true);
    try {
      await createTask(projectId, {
        title: taskForm.title.trim(),
        description: taskForm.description || "",
        priority: taskForm.priority,
        issueType: taskForm.issueType || "task",
        parentId: taskForm.parentId || null,
        assignedTo: taskForm.assignedTo || null,
        startedAt: taskForm.startedAt || null,
        dueDate: taskForm.dueDate || null,
      });
      toast.success("Task created");
      setTaskModalOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", issueType: "task", parentId: "", assignedTo: "", startedAt: "", dueDate: "" });
      if (onTaskChange) await onTaskChange();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create task");
    } finally {
      setTaskCreating(false);
    }
  };

  const onUpdateStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      if (onTaskChange) await onTaskChange();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update status");
    }
  };

  const onAssign = async (taskId, userId) => {
    try {
      await assignTask(taskId, userId || null);
      if (onTaskChange) await onTaskChange();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to assign task");
    }
  };

  return (
    <div>
      <div className="workspace__actions" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {!isCompleted && (
            <Button variant="primary" onClick={() => setTaskModalOpen(true)}>
              + New Task
            </Button>
          )}
          <Button variant="ghost" onClick={fetchTasks} disabled={tasksLoading}>
            Refresh
          </Button>
        </div>
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "8px" }}>
          <button 
            onClick={() => setTaskView("board")}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: taskView === "board" ? "rgba(255,255,255,0.15)" : "transparent", color: taskView === "board" ? "#fff" : "rgba(255,255,255,0.5)" }}
          >
            Board
          </button>
          <button 
            onClick={() => setTaskView("list")}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: taskView === "list" ? "rgba(255,255,255,0.15)" : "transparent", color: taskView === "list" ? "#fff" : "rgba(255,255,255,0.5)" }}
          >
            List
          </button>
        </div>
      </div>

      {tasksLoading ? (
        <div className="project-detail__loading">
          <Spinner size="lg" />
          <p className="project-detail__loading-text">Loading tasks...</p>
        </div>
      ) : taskView === "list" ? (
        <TasksListView 
          projectId={projectId}
          project={project}
          initialTasks={tasks}
          teamSorted={teamSorted}
          fetchTasks={fetchTasks}
        />
      ) : (
        <div className="workspace-tasks">
          {[
            { key: "todo", label: "To Do" },
            { key: "in-progress", label: "In Progress" },
            { key: "done", label: "Done" },
          ].map((col) => (
            <div 
              key={col.key} 
              className="workspace-column"
              onDragOver={(e) => {
                if (isCompleted) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                e.currentTarget.classList.add("is-dragover");
              }}
              onDragLeave={(e) => {
                if (isCompleted) return;
                e.currentTarget.classList.remove("is-dragover");
              }}
              onDrop={(e) => {
                if (isCompleted) return;
                e.preventDefault();
                e.currentTarget.classList.remove("is-dragover");
                const taskId = e.dataTransfer.getData("taskId");
                if (taskId && taskId !== "undefined") {
                  const task = tasks.find((t) => String(t._id) === taskId);
                  if (task && task.status !== col.key) {
                    onUpdateStatus(taskId, col.key);
                  }
                }
                setDraggedTaskId(null);
              }}
            >
              <div className="workspace-column__title">
                <div className="workspace-column__title-text">
                  {col.label} ({tasksByStatus[col.key].length})
                </div>
              </div>

              {tasksByStatus[col.key].map((t) => (
                <div 
                  key={t._id} 
                  className={`workspace-task ${draggedTaskId === t._id ? "is-dragging" : ""}`.trim()}
                  draggable={!isCompleted}
                  style={{
                    borderLeft: `4px solid ${t.issueType === "epic" ? "#bf5af2" : t.issueType === "story" ? "#32d74b" : t.issueType === "bug" ? "#ff453a" : "rgba(255,255,255,0.1)"}`
                  }}
                  onDragStart={(e) => {
                    setDraggedTaskId(t._id);
                    e.dataTransfer.setData("taskId", t._id);
                    e.dataTransfer.effectAllowed = "move";
                    if (e.dataTransfer.setDragImage) {
                      const dragImg = new Image(0, 0);
                      dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                      e.dataTransfer.setDragImage(dragImg, 0, 0);
                    }
                  }}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  {t.parentId && (
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ background: "rgba(10,132,255,0.2)", color: "#0a84ff", padding: "2px 6px", borderRadius: "4px" }}>
                        {project?.key}-{tasks.find(p => p._id === t.parentId)?.taskNumber || "Parent"}
                      </span>
                    </div>
                  )}
                  <div className="workspace-task__title">
                    {t.issueType === "epic" ? "🟣" : 
                     t.issueType === "story" ? "📗" : 
                     t.issueType === "sub-task" ? "🔲" : 
                     t.issueType === "bug" ? "🐛" : 
                     t.issueType === "feature" ? "✨" : "📝"}
                    <span style={{ fontWeight: 800, color: "#0a84ff", marginLeft: 6, marginRight: 6 }}>
                      {project?.key}-{t.taskNumber || "X"}
                    </span>
                    {t.title}
                  </div>
                  <div className="workspace-task__meta" style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>prio: {t.priority}</span>
                      <span>
                        assignee: {t.assignedTo?.name?.split(" ")[0] || "Unassigned"}
                      </span>
                    </div>
                    {(t.startedAt || t.dueDate) && (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "4px 6px", borderRadius: "4px", width: "fit-content" }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>
                          {t.startedAt ? new Date(t.startedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"} - {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="workspace-task__actions">
                    <select
                      className="workspace-select"
                      value={t.status}
                      onChange={(e) => onUpdateStatus(t._id, e.target.value)}
                    >
                      <option value="todo">todo</option>
                      <option value="in-progress">in-progress</option>
                      <option value="done">done</option>
                    </select>

                    <select
                      className="workspace-select"
                      value={t.assignedTo?._id || ""}
                      onChange={(e) => onAssign(t._id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {teamSorted.map((m) => (
                        <option key={m?.userId?._id} value={m?.userId?._id}>
                          {m?.userId?.name || "Member"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Create Task"
        onConfirm={onCreateTask}
        confirmText={taskCreating ? "Creating..." : "Create"}
      >
        <div className="workspace-modal__form" style={{ display: "flex", flexDirection: "column", gap: "20px", maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
          <div>
            <Input
              label="Title"
              value={taskForm.title}
              onChange={(e) => onChangeTaskForm("title", e.target.value)}
              placeholder="Example: Build chat UI"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input__label">Priority</label>
              <select
                className="input__field"
                value={taskForm.priority}
                onChange={(e) => onChangeTaskForm("priority", e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <div>
              <label className="input__label">Type</label>
              <select
                className="input__field"
                value={taskForm.issueType}
                onChange={(e) => onChangeTaskForm("issueType", e.target.value)}
              >
                <option value="epic">🟣 Epic</option>
                <option value="story">📗 Story</option>
                <option value="task">📝 Task</option>
                <option value="sub-task">🔲 Sub-task</option>
                <option value="bug">🐛 Bug</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input__label">Assignee</label>
              <select
                className="input__field"
                value={taskForm.assignedTo}
                onChange={(e) => onChangeTaskForm("assignedTo", e.target.value)}
              >
                <option value="">Unassigned</option>
                {teamSorted.map((m) => (
                  <option key={m?.userId?._id} value={m?.userId?._id}>
                    {m?.userId?.name || "Member"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input__label">Parent Issue (Optional)</label>
              <select
                className="input__field"
                value={taskForm.parentId}
                onChange={(e) => onChangeTaskForm("parentId", e.target.value)}
                disabled={taskForm.issueType === "epic"}
                style={{ opacity: taskForm.issueType === "epic" ? 0.5 : 1 }}
              >
                <option value="">None</option>
                {tasks
                  .filter(t => {
                    if (taskForm.issueType === "sub-task") {
                      return ["story", "task", "bug", "feature"].includes(t.issueType);
                    }
                    if (["story", "task", "bug", "feature"].includes(taskForm.issueType)) {
                      return t.issueType === "epic";
                    }
                    return false;
                  })
                  .map(t => (
                    <option key={t._id} value={t._id}>
                      {project?.key || "TASK"}-{t.taskNumber} {t.title}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <Input
                label="Start Date (Optional)"
                type="date"
                value={taskForm.startedAt}
                onChange={(e) => onChangeTaskForm("startedAt", e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Due Date (Optional)"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => onChangeTaskForm("dueDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div>
          <label className="input__label">Description</label>
          <textarea
            className="workspace-modal__textarea"
            rows={4}
            value={taskForm.description}
            onChange={(e) => onChangeTaskForm("description", e.target.value)}
            placeholder="What needs to be done?"
          />
        </div>
      </Modal>
    </div>
  );
}
