import { useState, useMemo } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Spinner from "../common/Spinner";
import { toast } from "react-toastify";
import { createTask, updateTaskStatus, assignTask } from "../../api/taskApi";

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
  });
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      "in-progress": tasks.filter((t) => t.status === "in-progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const onChangeTaskForm = (key, value) => {
    setTaskForm((prev) => ({ ...prev, [key]: value }));
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
      });
      toast.success("Task created");
      setTaskModalOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", issueType: "task", parentId: "", assignedTo: "" });
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
          <Button variant="primary" onClick={() => setTaskModalOpen(true)}>
            + New Task
          </Button>
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
        <div className="workspace-list-view" style={{ overflowX: "auto", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Type</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Key</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Title</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Priority</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Assignee</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 16px", fontSize: "16px" }}>
                    {t.issueType === "epic" ? "🟣" : t.issueType === "story" ? "📗" : t.issueType === "sub-task" ? "🔲" : t.issueType === "bug" ? "🐛" : t.issueType === "feature" ? "✨" : "📝"}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#0a84ff" }}>
                    {project?.key}-{t.taskNumber || "X"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {t.parentId && (
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginRight: "8px" }}>
                        ↳ {project?.key}-{tasks.find(p => p._id === t.parentId)?.taskNumber}
                      </span>
                    )}
                    {t.title}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{t.priority}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      className="workspace-select"
                      value={t.assignedTo?._id || ""}
                      onChange={(e) => onAssign(t._id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "13px", height: "auto" }}
                    >
                      <option value="">Unassigned</option>
                      {teamSorted.map((m) => (
                        <option key={m?.userId?._id} value={m?.userId?._id}>
                          {m?.userId?.name || "Member"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      className="workspace-select"
                      value={t.status}
                      onChange={(e) => onUpdateStatus(t._id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "13px", height: "auto" }}
                    >
                      <option value="todo">todo</option>
                      <option value="in-progress">in-progress</option>
                      <option value="done">done</option>
                    </select>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No tasks created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                e.currentTarget.classList.add("is-dragover");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("is-dragover");
              }}
              onDrop={(e) => {
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
                  draggable
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
                  <div className="workspace-task__meta">
                    <span>prio: {t.priority}</span>
                    <span>
                      assignee: {t.assignedTo?.name || (t.assignedTo ? "Assigned" : "Unassigned")}
                    </span>
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
        <div className="workspace-modal__grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="Title"
              value={taskForm.title}
              onChange={(e) => onChangeTaskForm("title", e.target.value)}
              placeholder="Example: Build chat UI"
            />
          </div>

          <div>
            <label className="input__label">Priority</label>
            <select
              className="workspace-select"
              value={taskForm.priority}
              onChange={(e) => onChangeTaskForm("priority", e.target.value)}
              style={{ width: "100%", height: 46, borderRadius: 18 }}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <div>
            <label className="input__label">Type</label>
            <select
              className="workspace-select"
              value={taskForm.issueType}
              onChange={(e) => onChangeTaskForm("issueType", e.target.value)}
              style={{ width: "100%", height: 46, borderRadius: 18 }}
            >
              <option value="epic">🟣 Epic</option>
              <option value="story">📗 Story</option>
              <option value="task">📝 Task</option>
              <option value="sub-task">🔲 Sub-task</option>
              <option value="bug">🐛 Bug</option>
            </select>
          </div>

          <div>
            <label className="input__label">Assignee</label>
            <select
              className="workspace-select"
              value={taskForm.assignedTo}
              onChange={(e) => onChangeTaskForm("assignedTo", e.target.value)}
              style={{ width: "100%", height: 46, borderRadius: 18 }}
            >
              <option value="">Unassigned</option>
              {teamSorted.map((m) => (
                <option key={m?.userId?._id} value={m?.userId?._id}>
                  {m?.userId?.name || "Member"}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="input__label">Parent Issue (Optional)</label>
            <select
              className="workspace-select"
              value={taskForm.parentId}
              onChange={(e) => onChangeTaskForm("parentId", e.target.value)}
              style={{ width: "100%", height: 46, borderRadius: 18 }}
            >
              <option value="">None</option>
              {tasks
                .filter(t => t.issueType === "epic" || t.issueType === "story")
                .map(t => (
                  <option key={t._id} value={t._id}>
                    {project?.key}-{t.taskNumber} {t.title}
                  </option>
              ))}
            </select>
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
