import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { getProjectSummary } from "../../api/analyticsApi";
import { getCurrentUser } from "../../api/authApi";
import { getProjectById, getProjectTeam, getGitHubMetrics, updateProject } from "../../api/projectApi";
import { getProjectTasks } from "../../api/taskApi";
import JourneyTab from "./JourneyTab";

import WorkspaceOverview from "../../components/workspace/WorkspaceOverview";
import WorkspaceTasks from "../../components/workspace/WorkspaceTasks";
import WorkspaceCalendar from "../../components/workspace/WorkspaceCalendar";
import WorkspaceChat from "../../components/workspace/WorkspaceChat";
import WorkspaceDevelopment from "../../components/workspace/WorkspaceDevelopment";

import "./Workspace.css";

export default function Workspace() {
  const { projectId } = useParams();
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

  // GitHub Metrics
  const [githubMetrics, setGithubMetrics] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);

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
      const [meRes, projRes] = await Promise.all([
        getCurrentUser(),
        getProjectById(projectId),
      ]);
      setMe(meRes.data?.data?.user);
      const proj = projRes.data?.data?.project || projRes.data?.project;
      setProject(proj);

      let member = false;
      if (proj?.owner?._id === meRes.data?.data?.user?._id) {
        member = true;
      }

      const teamRes = await getProjectTeam(projectId);
      const teamList = Array.isArray(teamRes.data?.data?.team) ? teamRes.data.data.team : [];
      setTeam(teamList);

      if (teamList.some((m) => String(m?.userId?._id) === String(meRes.data?.data?.user?._id))) {
        member = true;
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

  const fetchGitHubData = useCallback(async () => {
    if (!project?.githubIntegration?.isConnected) return;
    setGithubLoading(true);
    try {
      const res = await getGitHubMetrics(projectId);
      setGithubMetrics(res.data?.data?.metrics || null);
    } catch (e) {
      toast.error("Failed to fetch GitHub metrics");
    } finally {
      setGithubLoading(false);
    }
  }, [projectId, project?.githubIntegration?.isConnected]);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  useEffect(() => {
    if (!loading && project) {
      fetchSummary();
      if (project.githubIntegration?.isConnected) {
        fetchGitHubData();
      }
    }
  }, [fetchSummary, fetchGitHubData, loading, project]);

  useEffect(() => {
    if (!isMember) return;
    fetchTasks();
  }, [fetchTasks, isMember]);

  const teamSorted = useMemo(() => {
    const sorted = [...team];
    const ownerIdx = sorted.findIndex((m) => m?.role === "owner");
    if (ownerIdx > -1) {
      const owner = sorted.splice(ownerIdx, 1)[0];
      sorted.unshift(owner);
    }
    return sorted;
  }, [team]);

  const devMetrics = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    let completedThisWeek = 0;
    let overdueItems = 0;
    let openBugs = 0;

    tasks.forEach(t => {
      const updatedTime = new Date(t.updatedAt).getTime();
      const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : null;

      if (t.status === "done" && updatedTime >= sevenDaysAgo) completedThisWeek++;
      if (t.status !== "done" && dueTime && dueTime < now) overdueItems++;
      if (t.status !== "done" && t.issueType === "bug") openBugs++;
    });

    return { completedThisWeek, overdueItems, openBugs };
  }, [tasks]);

  const handleCompleteProject = async () => {
    if (!window.confirm("Are you sure you want to complete this project? It will be archived.")) return;
    try {
      await updateProject(projectId, { status: "completed" });
      toast.success("Project completed and archived");
      fetchBase();
    } catch (err) {
      toast.error("Failed to complete project");
    }
  };

  const isCompleted = project?.status === "completed";

  const allTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "development", label: "Development", icon: "💻" },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  if (isCompleted) {
    allTabs.unshift({ id: "journey", label: "Journey", icon: "✨" });
  }

  const activeTabs = isMember ? allTabs : allTabs.filter(t => ["overview", "journey", "analytics"].includes(t.id));

  if (loading) {
    return (
      <div className="workspace" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="workspace">
        <div className="workspace__header">
          <h1 className="workspace__title">Project Not Found</h1>
        </div>
      </div>
    );
  }

  if (!isMember && !isCompleted) {
    return (
      <div className="workspace">
        <div className="workspace__header">
          <div>
            <h1 className="workspace__title">{project.title}</h1>
            <p className="workspace__subtitle">You need to be an active team member to access this workspace.</p>
          </div>
          <div className="workspace__actions">
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Back to Project</Button>
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
            {isCompleted ? "Project Archive & Knowledge Base" : "Team space for planning tasks, chatting in real-time, and tracking progress."}
          </p>
          <div className="workspace__badges">
            <Badge variant={project.status}>{project.status}</Badge>
            <Badge variant="default">Members: {team.length}</Badge>
            {isMember && <Badge variant={isOwner ? "owner" : "member"}>{isOwner ? "owner" : "member"}</Badge>}
          </div>
        </div>
        <div className="workspace__actions">
          {isOwner && !isCompleted && <Button onClick={handleCompleteProject}>Complete Project</Button>}
          <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Back</Button>
        </div>
      </div>

      <div className="workspace__tabs">
        {activeTabs.map((t) => (
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

      {tab === "journey" && <JourneyTab project={project} isMember={isMember} onUpdate={fetchBase} />}

      {tab === "overview" && <WorkspaceOverview tasks={tasks} team={teamSorted} />}

      {tab === "calendar" && <WorkspaceCalendar project={project} tasks={tasks} onTaskClick={() => setTab("tasks")} />}

      {tab === "development" && (
        <WorkspaceDevelopment
          projectId={projectId}
          project={project}
          devMetrics={devMetrics}
          githubMetrics={githubMetrics}
          githubLoading={githubLoading}
          fetchGitHubData={fetchGitHubData}
          onProjectChange={(updatedProj) => setProject(updatedProj)}
        />
      )}

      {tab === "tasks" && (
        <WorkspaceTasks
          projectId={projectId}
          project={project}
          tasks={tasks}
          teamSorted={teamSorted}
          tasksLoading={tasksLoading}
          fetchTasks={fetchTasks}
          onTaskChange={async () => {
            await fetchTasks();
            await fetchSummary();
          }}
        />
      )}

      {tab === "chat" && <WorkspaceChat projectId={projectId} isMember={isMember} me={me} />}

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
          </div>
        </div>
      )}
    </div>
  );
}
