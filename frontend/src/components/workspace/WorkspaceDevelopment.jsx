import { useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Spinner from "../common/Spinner";
import { toast } from "react-toastify";
import { connectGitHub, disconnectGitHub, getEngineeringAssessment } from "../../api/projectApi";

export default function WorkspaceDevelopment({ projectId, project, devMetrics, githubMetrics, githubLoading, fetchGitHubData, onProjectChange }) {
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubForm, setGithubForm] = useState({ repoName: "", accessToken: "" });
  const [githubConnectLoading, setGithubConnectLoading] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  const handleGetAssessment = async () => {
    setAssessmentLoading(true);
    try {
      const res = await getEngineeringAssessment(projectId);
      setAssessment(res.data?.data?.assessment);
      toast.success("Assessment generated!");
    } catch {
      toast.error("Failed to generate assessment");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleConnectGitHub = async () => {
    let repoName = githubForm.repoName.trim();
    if (!repoName) {
      toast.error("Repository URL or name is required");
      return;
    }

    // Extract owner/repo if it's a full URL
    if (repoName.includes("github.com/")) {
      const parts = repoName.split("github.com/");
      repoName = parts[1].replace(".git", "").split("/").slice(0, 2).join("/");
    }

    setGithubConnectLoading(true);
    try {
      const res = await connectGitHub(projectId, { ...githubForm, repoName });
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

  const handleDisconnectGitHub = () => {
    setDisconnectModalOpen(true);
  };

  const confirmDisconnectGitHub = async () => {
    setDisconnectLoading(true);
    try {
      const res = await disconnectGitHub(projectId);
      if (onProjectChange) {
        onProjectChange(res.data?.data?.project || res.data?.project);
      }
      toast.success("GitHub disconnected");
      setDisconnectModalOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to disconnect GitHub");
    } finally {
      setDisconnectLoading(false);
    }
  };

  return (
    <div className="workspace-development" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          Development
        </h2>
      </div>

      {/* Top Section: AI Feedback */}
      <div style={{ background: "rgba(10,132,255,0.05)", border: "1px solid rgba(10,132,255,0.2)", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
             AI Feedback
          </h3>
          <Button onClick={handleGetAssessment} disabled={assessmentLoading}>
            {assessmentLoading ? "Analyzing Metrics..." : (assessment ? "Refresh Assessment" : "Get AI Feedback")}
          </Button>
        </div>

        {assessmentLoading && (
          <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            <Spinner />
            <p>Interpreting deterministic project data...</p>
          </div>
        )}

        {!assessmentLoading && !assessment && (
          <div style={{ padding: "16px 0", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
            Click "Get AI Feedback" to analyze your team's execution evidence (completed tasks, open bugs, PR cycle time) and receive actionable engineering guidance.
          </div>
        )}

        {!assessmentLoading && assessment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", padding: "4px 10px", borderRadius: "4px", background: assessment.status === 'Healthy' ? 'rgba(50, 215, 75, 0.2)' : assessment.status === 'Needs Attention' ? 'rgba(255, 69, 58, 0.2)' : 'rgba(10, 132, 255, 0.2)', color: assessment.status === 'Healthy' ? '#32d74b' : assessment.status === 'Needs Attention' ? '#ff453a' : '#0a84ff' }}>
                Execution Status: {assessment.status}
              </span>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.9)", lineHeight: "1.5" }}>{assessment.message}</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#32d74b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Strengths</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "rgba(255,255,255,0.8)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {assessment.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#ff9f0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Areas for Improvement</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "rgba(255,255,255,0.8)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {assessment.areasForImprovement?.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", borderLeft: "3px solid #0a84ff" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#0a84ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actionable Recommendations</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "rgba(255,255,255,0.9)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {assessment.recommendedActions?.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "right" }}>
              *Why did I get this? Review "The Evidence" below.
            </div>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "16px 0 0 0", color: "rgba(255,255,255,0.7)" }}>The Evidence (Raw Metrics)</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Top Row: 4 Large Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div className="workspace__card" style={{ padding: "20px", minHeight: "110px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "4px" }}>
              Work items <span title="Number of stories, tasks, and bugs marked as 'Done' in the past 7 days" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-text-dark)" }}>{devMetrics?.completedThisWeek || 0}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Completed this week</div>
            </div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "20px", minHeight: "110px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "4px" }}>
              Pull request cycle time <span title="Average time from first commit to PR merge in the last 7 days" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-text-dark)" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.prCycleTime ?? "0"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Rolling 7-day median</div>
            </div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "20px", minHeight: "110px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "4px" }}>
              Lead time for changes <span title="Average time between a commit and its deployment to production over the last 12 weeks" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-text-dark)" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.leadTimeForChanges ?? "0"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Rolling 12-week average</div>
            </div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "20px", minHeight: "110px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "4px" }}>
              Deployment frequency <span title="Average number of successful deployments to production per week" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-text-dark)" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.deploymentFrequency ?? "0"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Weekly average</div>
            </div>
          </div>
        </div>

        {/* Bottom Row: 5 Small Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
          <div className="workspace__card" style={{ padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Work items <span title="Items with a due date in the past that are not yet complete" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: devMetrics?.overdueItems > 0 ? "#dc2626" : "var(--color-text-dark)" }}>{devMetrics?.overdueItems || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Overdue</div>
          </div>
          <div className="workspace__card" style={{ padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Work items <span title="Items moved from 'Done' back to an active state" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--color-text-dark)" }}>0</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Reopened</div>
          </div>
          <div className="workspace__card" style={{ padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Bugs <span title="Unresolved bug tickets currently assigned to this project" style={{ color: "var(--color-text-muted)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: devMetrics?.openBugs > 0 ? "#d97706" : "var(--color-text-dark)" }}>{devMetrics?.openBugs || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Open</div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "4px" }}>
              Pull requests
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--color-text-dark)" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.openPullRequests ?? "0"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Open</div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-dark)", marginBottom: "4px" }}>
              Vulnerabilities
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: githubMetrics?.criticalVulnerabilities > 0 ? "#dc2626" : "var(--color-text-dark)" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.criticalVulnerabilities ?? "0"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Critical</div>
          </div>
        </div>
      </div>

      <div>
        {project?.githubIntegration?.isConnected ? (
          <div className="workspace-dev__connect-box" style={{ padding: "40px 24px", textAlign: "center", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)" }}>Connected to GitHub</h3>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px" }}>
              Repository: <a href={`https://github.com/${project.githubIntegration.repoName}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-text-dark)", textDecoration: "underline", fontWeight: "600" }}>{project.githubIntegration.repoName}</a>
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Button variant="secondary" onClick={() => fetchGitHubData && fetchGitHubData()}>
                Refresh Data
              </Button>
              <Button variant="danger" onClick={handleDisconnectGitHub}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="workspace-dev__connect-box" style={{ padding: "60px 24px", textAlign: "center", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", color: "var(--color-text-dark)" }}>Connect your tools</h3>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px", maxWidth: "440px" }}>
              Connect your team's code repository (GitHub, GitLab, Bitbucket) to see pull requests, commits, branches, and deployments linked directly to your work items here.
            </p>
            <Button variant="primary" className="btn-connect-github" style={{ marginTop: "48px" }} onClick={() => setGithubModalOpen(true)}>Connect GitHub</Button>
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
              label="GitHub Repository URL"
              value={githubForm.repoName}
              onChange={(e) => setGithubForm({ ...githubForm, repoName: e.target.value })}
              placeholder="e.g. https://github.com/facebook/react"
            />
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
              Paste the full URL to the repository. The repository must be public or you must provide a personal access token below.
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
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: "var(--color-text-dark)", textDecoration: "underline" }}>Get a token</a> with 'repo' scope.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        title="Disconnect GitHub"
        onConfirm={confirmDisconnectGitHub}
        confirmText={disconnectLoading ? "Disconnecting..." : "Disconnect"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-dark)" }}>
            Are you sure you want to disconnect <strong>{project?.githubIntegration?.repoName}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
            This will remove all GitHub-related metrics and pull request data from this project's dashboard. Your actual GitHub repository will not be modified.
          </p>
        </div>
      </Modal>
    </div>
  );
}
