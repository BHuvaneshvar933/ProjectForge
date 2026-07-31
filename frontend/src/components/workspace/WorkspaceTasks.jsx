import React, { useState, useMemo } from "react";
import { Zap, Bookmark, CheckSquare, Bug, Target } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Spinner from "../common/Spinner";
import { toast } from "react-toastify";
import { createTask, updateTaskStatus, assignTask } from "../../api/taskApi";
import { uploadFile } from "../../api/uploadApi";
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
    attachmentUrl: "",
    attachmentName: "",
  });
  const [taskUploading, setTaskUploading] = useState(false);
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
        attachmentUrl: taskForm.attachmentUrl || null,
        attachmentName: taskForm.attachmentName || null,
      });
      toast.success("Task created");
      setTaskModalOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", issueType: "task", parentId: "", assignedTo: "", startedAt: "", dueDate: "", attachmentUrl: "", attachmentName: "" });
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTaskUploading(true);
    try {
      const res = await uploadFile(file);
      if (res.data.success) {
        onChangeTaskForm("attachmentUrl", res.data.data.url);
        onChangeTaskForm("attachmentName", res.data.data.filename);
        toast.success("File uploaded successfully");
      }
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setTaskUploading(false);
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
        <DragDropContext onDragEnd={(result) => {
          if (isCompleted) return;
          if (!result.destination) return;
          const { source, destination, draggableId } = result;
          if (source.droppableId !== destination.droppableId) {
             onUpdateStatus(draggableId, destination.droppableId);
          }
        }}>
        <div className="workspace-tasks">
          {[
            { key: "todo", label: "To Do" },
            { key: "in-progress", label: "In Progress" },
            { key: "done", label: "Done" },
          ].map((col) => (
            <Droppable droppableId={col.key} key={col.key} isDropDisabled={isCompleted}>
              {(provided, snapshot) => (
                <div 
                  className={`workspace-column ${snapshot.isDraggingOver ? 'is-dragover' : ''}`.trim()}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="workspace-column__title">
                    <div className="workspace-column__title-text">
                      {col.label} ({tasksByStatus[col.key].length})
                    </div>
                  </div>

                  {tasksByStatus[col.key].map((t, index) => (
                    <Draggable key={t._id} draggableId={String(t._id)} index={index} isDragDisabled={isCompleted}>
                      {(provided, snapshot) => (
                        <div 
                          className={`workspace-task ${snapshot.isDragging ? "is-dragging" : ""}`.trim()}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            borderLeft: "4px solid rgba(255, 255, 255, 0.2)"
                          }}
                        >
                  <div className="workspace-task__title" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <div style={{ display: "flex", flexShrink: 0, marginTop: "2px" }}>
                      {t.issueType === "epic" ? <div style={{ background: "rgba(191, 90, 242, 0.15)", color: "#bf5af2", padding: "4px", borderRadius: "4px", display: "flex" }}><Zap size={14} /></div> : 
                       t.issueType === "story" ? <div style={{ background: "rgba(50, 215, 75, 0.15)", color: "#32d74b", padding: "4px", borderRadius: "4px", display: "flex" }}><Bookmark size={14} /></div> : 
                       t.issueType === "sub-task" ? <div style={{ background: "rgba(94, 92, 230, 0.15)", color: "#5e5ce6", padding: "4px", borderRadius: "4px", display: "flex" }}><CheckSquare size={14} /></div> : 
                       t.issueType === "bug" ? <div style={{ background: "rgba(255, 69, 58, 0.15)", color: "#ff453a", padding: "4px", borderRadius: "4px", display: "flex" }}><Bug size={14} /></div> : 
                       t.issueType === "feature" ? <div style={{ background: "rgba(10, 132, 255, 0.15)", color: "#0a84ff", padding: "4px", borderRadius: "4px", display: "flex" }}><Target size={14} /></div> : 
                       <div style={{ background: "rgba(94, 92, 230, 0.15)", color: "#5e5ce6", padding: "4px", borderRadius: "4px", display: "flex" }}><CheckSquare size={14} /></div>}
                    </div>
                    <div style={{ flex: 1, wordBreak: "break-word" }}>
                      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)", marginRight: 6 }}>
                        {project?.key || "TASK"}-{t.taskNumber || "X"}
                      </span>
                      {t.title}
                    </div>
                  </div>
                  {t.attachmentUrl && (
                    <div style={{ marginTop: "4px" }}>
                      <a href={t.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        📎 {t.attachmentName?.substring(0, 20) || "Attachment"}
                      </a>
                    </div>
                  )}
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
        </DragDropContext>
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

        <div style={{ marginTop: "16px" }}>
          <label className="input__label">Attachment (Optional)</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
            <label style={{ 
              background: "rgba(255,255,255,0.1)", 
              padding: "8px 16px", 
              borderRadius: "6px", 
              cursor: "pointer", 
              fontSize: "14px",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              {taskUploading ? <Spinner size="sm" /> : "📎 Upload File"}
              <input type="file" style={{ display: "none" }} onChange={handleFileUpload} disabled={taskUploading} />
            </label>
            {taskForm.attachmentName && (
              <span style={{ fontSize: "12px", color: "#32d74b" }}>
                ✓ {taskForm.attachmentName}
              </span>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
