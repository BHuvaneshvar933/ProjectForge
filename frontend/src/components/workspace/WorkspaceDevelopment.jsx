import { useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Spinner from "../common/Spinner";
import { toast } from "react-toastify";
import { connectGitHub } from "../../api/projectApi";

export default function WorkspaceDevelopment({ projectId, project, devMetrics, githubMetrics, githubLoading, fetchGitHubData, onProjectChange }) {
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubForm, setGithubForm] = useState({ repoName: "", accessToken: "" });
  const [githubConnectLoading, setGithubConnectLoading] = useState(false);

  const handleConnectGitHub = async () => {
    if (!githubForm.repoName.trim()) {
      toast.error("Repository name is required");
      return;
    }
    setGithubConnectLoading(true);
    try {
      const res = await connectGitHub(projectId, githubForm);
      if (onProjectChange) {
        onProjectChange(res.data?.data?.project || res.data?.project);
      }
      toast.success("GitHub connected successfully!");
      setGithubModalOpen(false);
      if (fetchGitHubData) {
        fetchGitHubData();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to connect GitHub");
    } finally {
      setGithubConnectLoading(false);
    }
  };

  return (
    <div className="workspace-development" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          Key metrics <span style={{ fontSize: "10px", background: "rgba(10,132,255,0.2)", color: "#0a84ff", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>BETA</span>
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Real Metrics */}
        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Work items <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px" }}>{devMetrics?.completedThisWeek || 0}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Completed this week</div>
        </div>

        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Work items <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px", color: devMetrics?.overdueItems > 0 ? "#ff453a" : "inherit" }}>{devMetrics?.overdueItems || 0}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Overdue</div>
        </div>

        <div className="workspace__card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Bugs <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px", color: devMetrics?.openBugs > 0 ? "#ff9f0a" : "inherit" }}>{devMetrics?.openBugs || 0}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Open</div>
        </div>

        {/* GitHub Metrics */}
        <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Pull requests <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px" }}>
            {githubLoading ? <Spinner size="sm" /> : githubMetrics?.openPullRequests ?? "0"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Open</div>
        </div>

        <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Pull request cycle time <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px" }}>
            {githubLoading ? <Spinner size="sm" /> : githubMetrics?.prCycleTime ?? "-"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Rolling 7-day median</div>
        </div>

        <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Lead time for changes <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px" }}>
            {githubLoading ? <Spinner size="sm" /> : githubMetrics?.leadTimeForChanges ?? "-"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Rolling 12-week average</div>
        </div>

        <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Deployment frequency <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px" }}>
            {githubLoading ? <Spinner size="sm" /> : githubMetrics?.deploymentFrequency ?? "0"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Weekly average</div>
        </div>

        <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            Vulnerabilities <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>ⓘ</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px", color: githubMetrics?.criticalVulnerabilities > 0 ? "#ff453a" : "inherit" }}>
            {githubLoading ? <Spinner size="sm" /> : githubMetrics?.criticalVulnerabilities ?? "0"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Critical</div>
        </div>
      </div>

      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 16px 0" }}>Related work</h2>
        {project?.githubIntegration?.isConnected ? (
          <div className="workspace__card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "32px" }}>🐙</div>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>Connected to GitHub</h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                Repository: <a href={`https://github.com/${project.githubIntegration.repoName}`} target="_blank" rel="noreferrer" style={{ color: "#0a84ff", textDecoration: "none" }}>{project.githubIntegration.repoName}</a>
              </p>
            </div>
            <Button style={{ marginLeft: "auto" }} variant="secondary" onClick={() => fetchGitHubData && fetchGitHubData()}>
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="workspace__card" style={{ padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔌</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Connect your tools</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "14px", maxWidth: "400px" }}>
              Connect your team's code repository (GitHub, GitLab, Bitbucket) to see pull requests, commits, branches, and deployments linked directly to your work items here.
            </p>
            <Button style={{ marginTop: "24px" }} onClick={() => setGithubModalOpen(true)}>Connect GitHub</Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        title="Connect GitHub Repository"
        onConfirm={handleConnectGitHub}
        confirmText={githubConnectLoading ? "Connecting..." : "Connect"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <Input
              label="Repository Name"
              value={githubForm.repoName}
              onChange={(e) => setGithubForm({ ...githubForm, repoName: e.target.value })}
              placeholder="e.g. facebook/react"
            />
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
              The repository must be public or you must provide a personal access token below.
            </p>
          </div>
          <div>
            <Input
              label="Personal Access Token (Optional)"
              type="password"
              value={githubForm.accessToken}
              onChange={(e) => setGithubForm({ ...githubForm, accessToken: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: "#0a84ff", textDecoration: "none" }}>Get a token</a> with 'repo' scope.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
