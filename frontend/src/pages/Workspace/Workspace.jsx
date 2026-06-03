import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import { getProjectSummary } from "../../api/analyticsApi";
import { getCurrentUser } from "../../api/authApi";
import { getProjectMessages } from "../../api/messageApi";
import { getJoinedProjects, getProjectById, getProjectTeam } from "../../api/projectApi";
import {
  assignTask,
  createTask,
  getProjectTasks,
  updateTaskStatus,
} from "../../api/taskApi";
import { disconnectSocket, getSocket } from "../../realtime/socketClient";
import "./Workspace.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "chat", label: "Chat" },
  { id: "members", label: "Members" },
  { id: "analytics", label: "Analytics" },
];

const groupTasks = (tasks) => {
  const by = { todo: [], "in-progress": [], done: [] };
  for (const t of tasks || []) {
    const key = by[t?.status] ? t.status : "todo";
    by[key].push(t);
  }
  return by;
};

export default function Workspace() {
  const { id } = useParams();
  const projectId = id;
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [me, setMe] = useState(null);
  const [team, setTeam] = useState([]);
  const [summary, setSummary] = useState(null);

  // Tasks
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskCreating, setTaskCreating] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
  });

  // Chat
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);
  const stopTypingTimer = useRef(null);
  const listRef = useRef(null);
  const chatInputRef = useRef(null);

  const isOwner = useMemo(() => {
    if (!me?._id || !project?.owner?._id) return false;
    return String(me._id) === String(project.owner._id);
  }, [me?._id, project?.owner?._id]);

  const isMember = useMemo(() => {
    if (isOwner) return true;
    if (!me?._id) return false;
    return (team || []).some((m) => String(m?.userId?._id) === String(me._id));
  }, [isOwner, me?._id, team]);

  const fetchBase = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, projRes, joinedRes] = await Promise.all([
        getCurrentUser(),
        getProjectById(projectId),
        getJoinedProjects(),
      ]);

      setMe(meRes.data?.data?.user ?? null);
      setProject(projRes.data?.data?.project ?? null);

      const joined = joinedRes.data?.data?.projects ?? [];
      const member = Array.isArray(joined)
        ? joined.some((p) => String(p?._id) === String(projectId))
        : false;

      // Only members can access the full team list.
      if (member) {
        const teamRes = await getProjectTeam(projectId);
        setTeam(Array.isArray(teamRes.data?.data?.team) ? teamRes.data.data.team : []);
      } else {
        setTeam([]);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load workspace");
      setProject(null);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getProjectSummary(projectId);
      setSummary(res.data?.data?.summary ?? null);
    } catch {
      setSummary(null);
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await getProjectTasks(projectId, { page: 1, limit: 100 });
      const list = res.data?.data?.tasks ?? res.data?.data?.result?.tasks ?? [];
      setTasks(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [projectId]);

  const fetchMessages = useCallback(async () => {
    setChatLoading(true);
    try {
      const res = await getProjectMessages(projectId, { page: 1, limit: 50 });
      const list = res.data?.data?.messages ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load chat history");
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  useEffect(() => {
    if (!loading && project) {
      fetchSummary();
    }
  }, [fetchSummary, loading, project]);

  useEffect(() => {
    if (!isMember) return;
    if (tab === "tasks") fetchTasks();
    if (tab === "chat") fetchMessages();
  }, [fetchMessages, fetchTasks, isMember, tab]);

  // Socket chat wiring (only when member)
  useEffect(() => {
    if (!isMember) return;
    if (tab !== "chat") return;

    const socket = getSocket();

    const onNewMessage = (msg) => {
      if (String(msg?.projectId) !== String(projectId)) return;
      setMessages((prev) => [...prev, msg]);
    };

    const onTyping = ({ userId, name }) => {
      if (!userId) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => String(u.userId) === String(userId))) return prev;
        return [...prev, { userId, name: name || "Someone" }];
      });
    };

    const onStopTyping = ({ userId }) => {
      if (!userId) return;
      setTypingUsers((prev) => prev.filter((u) => String(u.userId) !== String(userId)));
    };

    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onTyping);
    socket.on("user-stop-typing", onStopTyping);

    socket.emit("join-project", projectId, (res) => {
      if (!res?.ok) {
        toast.error(res?.error || "Failed to join chat");
      }
    });

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onTyping);
      socket.off("user-stop-typing", onStopTyping);
    };
  }, [isMember, projectId, tab]);

  useEffect(() => {
    if (tab !== "chat") return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, tab]);

  const onSend = async () => {
    const content = chatInput.trim();
    if (!content) return;
    if (!isMember) return;

    const socket = getSocket();
    setChatInput("");
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "";
    }

    socket.emit("send-message", { projectId, content }, (res) => {
      if (!res?.ok) {
        toast.error(res?.error || "Failed to send message");
      }
    });
  };

  const emitTyping = () => {
    if (!isMember) return;
    const socket = getSocket();

    if (typingTimer.current) return;
    typingTimer.current = setTimeout(() => {
      typingTimer.current = null;
    }, 400);

    socket.emit("typing", { projectId });

    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      socket.emit("stop-typing", { projectId });
    }, 900);
  };

  const canSend = chatInput.trim().length > 0;

  const getSenderName = (m) => m?.sender?.name || m?.senderId?.name || "User";
  const getSenderId = (m) =>
    m?.sender?._id || m?.senderId?._id || m?.senderId || m?.sender;

  const isMineMessage = (m) => {
    if (!me?._id) return false;
    const sid = getSenderId(m);
    if (!sid) return false;
    return String(sid) === String(me._id);
  };

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
        assignedTo: taskForm.assignedTo || null,
      });
      toast.success("Task created");
      setTaskModalOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium", assignedTo: "" });
      await fetchTasks();
      await fetchSummary();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create task");
    } finally {
      setTaskCreating(false);
    }
  };

  const onUpdateStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      await fetchTasks();
      await fetchSummary();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update status");
    }
  };

  const onAssign = async (taskId, assignedTo) => {
    try {
      await assignTask(taskId, assignedTo || null);
      await fetchTasks();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to assign task");
    }
  };

  const tasksByStatus = useMemo(() => groupTasks(tasks), [tasks]);
  const teamSorted = useMemo(() => {
    const list = Array.isArray(team) ? [...team] : [];
    list.sort((a, b) => {
      const ar = a?.role === "owner" ? 0 : 1;
      const br = b?.role === "owner" ? 0 : 1;
      return ar - br;
    });
    return list;
  }, [team]);

  useEffect(() => {
    return () => {
      try {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
      } catch {
        // ignore
      }
      disconnectSocket();
    };
  }, []);

  if (loading) {
    return (
      <div className="project-detail__loading">
        <Spinner size="lg" />
        <p className="project-detail__loading-text">Loading workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail__error">
        <h2 className="project-detail__error-title">Workspace unavailable</h2>
        <p className="project-detail__error-text">Project not found or you do not have access.</p>
        <Link to="/projects">
          <Button>Browse Projects</Button>
        </Link>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="workspace">
        <div className="workspace__header">
          <div>
            <h1 className="workspace__title">{project.title}</h1>
            <p className="workspace__subtitle">
              You need to be an active team member to access this workspace.
            </p>
          </div>
          <div className="workspace__actions">
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="workspace__header">
        <div>
          <h1 className="workspace__title">{project.title}</h1>
          <p className="workspace__subtitle">
            Team space for planning tasks, chatting in real-time, and tracking progress.
          </p>
          <div className="workspace__badges">
            <Badge variant={project.status}>{project.status}</Badge>
            <Badge variant="default">Members: {team.length}</Badge>
            <Badge variant={isOwner ? "owner" : "member"}>{isOwner ? "owner" : "member"}</Badge>
          </div>
        </div>
        <div className="workspace__actions">
          <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>
            Back
          </Button>
        </div>
      </div>

      <div className="workspace__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`workspace__tab ${tab === t.id ? "is-active" : ""}`.trim()}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="workspace__grid">
          <div className="workspace__card">
            <div className="workspace__card-title">Quick Stats</div>
            <div className="workspace__kv">
              <div className="workspace__kvi">
                <div className="workspace__kvi-label">Tasks</div>
                <div className="workspace__kvi-value">
                  {summary?.tasks?.total ?? "-"}
                </div>
                <div className="workspace__kvi-sub">
                  done: {summary?.tasks?.byStatus?.done ?? "-"}
                </div>
              </div>
              <div className="workspace__kvi">
                <div className="workspace__kvi-label">Messages</div>
                <div className="workspace__kvi-value">
                  {summary?.messages?.total ?? "-"}
                </div>
                <div className="workspace__kvi-sub">project chat volume</div>
              </div>
              <div className="workspace__kvi">
                <div className="workspace__kvi-label">Team</div>
                <div className="workspace__kvi-value">
                  {summary?.team?.activeCount ?? team.length}
                </div>
                <div className="workspace__kvi-sub">active members</div>
              </div>
              <div className="workspace__kvi">
                <div className="workspace__kvi-label">Views</div>
                <div className="workspace__kvi-value">
                  {summary?.project?.viewCount ?? project.viewCount ?? 0}
                </div>
                <div className="workspace__kvi-sub">public project page</div>
              </div>
            </div>
          </div>
          <div className="workspace__card">
            <div className="workspace__card-title">Your Access</div>
            <div className="workspace__kvi">
              <div className="workspace__kvi-label">Signed In As</div>
              <div className="workspace__kvi-value" style={{ fontSize: 16 }}>
                {me?.name || me?.email || "-"}
              </div>
              <div className="workspace__kvi-sub">{isOwner ? "Project Owner" : "Team Member"}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="workspace-members">
          {teamSorted.map((m) => (
            <div key={m._id} className="workspace-member">
              <div className="workspace-member__left">
                <div className="workspace-member__avatar">
                  {(m?.userId?.name || "U")[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="workspace-member__name">{m?.userId?.name || "Unknown"}</div>
                  <div className="workspace-member__role">{m?.projectRole || (m?.role === "owner" ? "Project Owner" : "Member")}</div>
                </div>
              </div>
              <Badge variant={m?.role || "member"}>{m?.role || "member"}</Badge>
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <div className="workspace__actions" style={{ marginBottom: 14 }}>
            <Button variant="primary" onClick={() => setTaskModalOpen(true)}>
              + New Task
            </Button>
            <Button variant="ghost" onClick={fetchTasks} disabled={tasksLoading}>
              Refresh
            </Button>
          </div>

          {tasksLoading ? (
            <div className="project-detail__loading">
              <Spinner size="lg" />
              <p className="project-detail__loading-text">Loading tasks...</p>
            </div>
          ) : (
            <div className="workspace-tasks">
              {[
                { key: "todo", label: "To Do" },
                { key: "in-progress", label: "In Progress" },
                { key: "done", label: "Done" },
              ].map((col) => (
                <div key={col.key} className="workspace-column">
                  <div className="workspace-column__title">
                    <div className="workspace-column__title-text">
                      {col.label} ({tasksByStatus[col.key].length})
                    </div>
                  </div>

                  {tasksByStatus[col.key].map((t) => (
                    <div key={t._id} className="workspace-task">
                      <div className="workspace-task__title">{t.title}</div>
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
            <div className="workspace-modal__grid">
              <Input
                label="Title"
                value={taskForm.title}
                onChange={(e) => onChangeTaskForm("title", e.target.value)}
                placeholder="Example: Build chat UI"
              />

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

            <div style={{ height: 10 }} />

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
          </Modal>
        </div>
      )}

      {tab === "chat" && (
        <div className="workspace__card">
          <div className="workspace-chat">
            <div ref={listRef} className="workspace-chat__list">
              {chatLoading ? (
                <div className="project-detail__loading">
                  <Spinner size="lg" />
                  <p className="project-detail__loading-text">Loading messages...</p>
                </div>
              ) : (
                <>
                  {messages.map((m) => {
                    const mine = isMineMessage(m);
                    const senderName = getSenderName(m);
                    return (
                      <div
                        key={m._id || `${m.createdAt}-${m.content}`}
                        className={`workspace-chat__row ${mine ? "is-mine" : "is-theirs"}`.trim()}
                      >
                        {!mine && (
                          <div className="workspace-chat__avatar" aria-hidden="true">
                            {(senderName || "U")[0]}
                          </div>
                        )}
                        <div className={`workspace-chat__bubble ${mine ? "is-mine" : "is-theirs"}`.trim()}>
                          {!mine && <div className="workspace-chat__sender">{senderName}</div>}
                          <div className="workspace-chat__text">{m.content}</div>
                          <div className="workspace-chat__time">
                            {m?.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {typingUsers.length > 0 && (
                    <div className="workspace-chat__typing-row" aria-live="polite">
                      <div className="workspace-chat__typing-dot" aria-hidden="true" />
                      <div className="workspace-chat__typing">
                        {typingUsers.slice(0, 2).map((u) => u.name).join(", ")}
                        {typingUsers.length > 2 ? " and others" : ""} typing...
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="workspace-chat__composer">
              <textarea
                ref={chatInputRef}
                className="workspace-chat__input"
                value={chatInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setChatInput(next);
                  emitTyping();

                  // Auto-grow up to max height for a chat-app feel.
                  const el = chatInputRef.current;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                  }
                }}
                placeholder="Write a message..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />

              <button
                type="button"
                className="workspace-chat__send"
                onClick={onSend}
                disabled={!canSend}
                aria-label="Send message"
                title={canSend ? "Send" : "Type a message to send"}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="workspace__card">
          <div className="workspace__card-title">Project Analytics</div>
          <div className="workspace__kv">
            <div className="workspace__kvi">
              <div className="workspace__kvi-label">Completion</div>
              <div className="workspace__kvi-value">
                {typeof summary?.project?.metrics?.completionPercentage === "number"
                  ? `${Math.round(summary.project.metrics.completionPercentage)}%`
                  : "-"}
              </div>
              <div className="workspace__kvi-sub">from project metrics</div>
            </div>
            <div className="workspace__kvi">
              <div className="workspace__kvi-label">Velocity</div>
              <div className="workspace__kvi-value">
                {typeof summary?.project?.metrics?.velocityScore === "number"
                  ? summary.project.metrics.velocityScore
                  : "-"}
              </div>
              <div className="workspace__kvi-sub">project velocity score</div>
            </div>
            <div className="workspace__kvi">
              <div className="workspace__kvi-label">Team Capacity</div>
              <div className="workspace__kvi-value">
                {summary?.project?.currentTeamSize ?? project.currentTeamSize}
                <span style={{ opacity: 0.5 }}> / </span>
                {summary?.project?.teamSizeRequired ?? project.teamSizeRequired}
              </div>
              <div className="workspace__kvi-sub">members filled</div>
            </div>
            <div className="workspace__kvi">
              <div className="workspace__kvi-label">Open Roles</div>
              <div className="workspace__kvi-value">
                {summary?.project?.openRolesCount ?? (Array.isArray(project.openRoles) ? project.openRoles.length : 0)}
              </div>
              <div className="workspace__kvi-sub">slots listed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
