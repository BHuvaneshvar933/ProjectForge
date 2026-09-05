import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import { getProjectSummary } from "../../api/analyticsApi";
import { getCurrentUser } from "../../api/authApi";
import { getProjectById, getProjectTeam, getGitHubMetrics, updateProject, removeTeamMember } from "../../api/projectApi";
import { getProjectTasks } from "../../api/taskApi";
import JourneyTab from "./JourneyTab";

import WorkspaceOverview from "../../components/workspace/WorkspaceOverview";
import WorkspaceTasks from "../../components/workspace/WorkspaceTasks";
import WorkspaceCalendar from "../../components/workspace/WorkspaceCalendar";
import WorkspaceChat from "../../components/workspace/WorkspaceChat";
import WorkspaceDevelopment from "../../components/workspace/WorkspaceDevelopment";
import WorkspaceReleases from "../../components/workspace/WorkspaceReleases";
import WorkspaceSummary from "../../components/workspace/WorkspaceSummary";
import ProjectCompletionModal from "../../components/workspace/ProjectCompletionModal";
import CelebrationTab from "./CelebrationTab";
import WorkspaceFiles from "../../components/workspace/WorkspaceFiles";

import "./Workspace.css";

export default function Workspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [me, setMe] = useState(null);
  const [team, setTeam] = useState([]);


  // Tasks
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  // GitHub Metrics
  const [githubMetrics, setGithubMetrics] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState(null);

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

      const teamRes = await getProjectTeam(projectId);
      const teamList = Array.isArray(teamRes.data?.data?.team) ? teamRes.data.data.team : [];
      setTeam(teamList);
    } catch {
      toast.error("Failed to load workspace");
      setProject(null);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchSummary = useCallback(async () => {
    try {
      await getProjectSummary(projectId);
    } catch {
      // Do nothing
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

  const fetchGitHubData = useCallback(async (silent = false) => {
    if (!project?.githubIntegration?.isConnected) return;
    setGithubLoading(true);
    try {
      const res = await getGitHubMetrics(projectId);
      setGithubMetrics(res.data?.data?.metrics || null);
    } catch (e) {
      if (!silent) {
        const msg = e.response?.data?.message?.toLowerCase() || "";
        if (msg.includes("rate limit")) {
          toast.error("GitHub API limit reached");
        } else {
          toast.error(e.response?.data?.message || "Failed to fetch GitHub metrics");
        }
      }
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
        fetchGitHubData(true);
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

  const handleCompleteProject = async (visibility) => {
    try {
      await updateProject(projectId, { status: "completed", visibility });
      toast.success("Project completed and archived");
      setCompletionModalOpen(false);
      setTab("celebration");
      fetchBase();
    } catch {
      toast.error("Failed to complete project");
    }
  };

  const handleResumeProject = async () => {
    try {
      await updateProject(projectId, { status: "in-progress" });
      toast.success("Project resumed");
      setResumeModalOpen(false);
      setTab("overview");
      fetchBase();
    } catch {
      toast.error("Failed to resume project");
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      await removeTeamMember(projectId, removeMemberId);
      toast.success("Member removed successfully");
      setRemoveMemberId(null);
      fetchBase();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const isCompleted = project?.status === "completed";

  const allTabs = [
    ...(isCompleted ? [{ id: "celebration", label: "Celebration" }] : []),
    { id: "overview", label: "Overview" },
    { id: "journey", label: "Journey" },
    { id: "tasks", label: "Tasks" },
    { id: "calendar", label: "Calendar" },
    { id: "files", label: "Files" },
    { id: "chat", label: "Chat" },
    { id: "development", label: "Development" },
    { id: "releases", label: "Releases" },
  ];


  const activeTabs = isMember ? allTabs : allTabs.filter(t => ["overview", "journey", "celebration"].includes(t.id));

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
        <PageHeader
          title={project.title}
          actions={
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Back to Project</Button>
          }
        />
        <p className="workspace__subtitle" style={{ marginTop: '20px' }}>
          You need to be an active team member to access this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="workspace">
      <PageHeader
        title={project.title}
        badges={
          <>
            <Badge variant={project.status}>{project.status}</Badge>
            <Badge variant="default">Members: {team.length}</Badge>
            {isMember && <Badge variant={isOwner ? "owner" : "member"}>{isOwner ? "owner" : "member"}</Badge>}
          </>
        }
        actions={
          <>
            {isOwner && !isCompleted && <Button onClick={() => setCompletionModalOpen(true)}>Complete Project</Button>}
            {isOwner && isCompleted && <Button onClick={() => setResumeModalOpen(true)}>Resume Project</Button>}
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Back</Button>
          </>
        }
      />

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

      {tab === "celebration" && isCompleted && (
        <CelebrationTab 
          project={project} 
          team={teamSorted} 
          myTeamRecord={team.find(m => m.userId?._id === me?._id || m.userId === me?._id)}
        />
      )}

      {tab === "journey" && (
        isCompleted 
          ? <WorkspaceSummary project={project} tasks={tasks} team={teamSorted} me={me} />
          : <JourneyTab project={project} isMember={isMember} onUpdate={fetchBase} />
      )}

      {tab === "overview" && <WorkspaceOverview project={project} tasks={tasks} team={teamSorted} isOwner={isOwner} onRemoveMember={(id) => setRemoveMemberId(id)} />}

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

      { tab === "releases" && <WorkspaceReleases projectId={projectId} project={project} /> }

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

      {tab === "chat" && <WorkspaceChat projectId={projectId} isMember={isMember} me={me} isCompleted={isCompleted} />}

      {tab === "files" && <WorkspaceFiles projectId={projectId} isMember={isMember} />}

      <ProjectCompletionModal 
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        project={project}
        onComplete={handleCompleteProject}
        onGoToJourney={() => {
          setCompletionModalOpen(false);
          setTab("journey");
        }}
      />

      <Modal 
        isOpen={resumeModalOpen} 
        onClose={() => setResumeModalOpen(false)} 
        title="Resume Project"
        onConfirm={handleResumeProject}
        confirmText="Yes, Resume"
      >
        <p style={{ color: "var(--color-text-dark)", marginBottom: "16px", fontSize: "14px" }}>
          Are you sure you want to resume this project? This will move it back to 'in-progress' status.
        </p>
      </Modal>

      <Modal 
        isOpen={!!removeMemberId} 
        onClose={() => setRemoveMemberId(null)} 
        title="Remove Team Member"
        onConfirm={handleRemoveMember}
        confirmText="Remove Member"
      >
        <p style={{ color: "var(--color-text-dark)", marginBottom: "16px", fontSize: "14px" }}>
          Are you sure you want to remove this member? They will lose access to the active workspace but will retain credit on their profile.
        </p>
      </Modal>
    </div>
  );
}
