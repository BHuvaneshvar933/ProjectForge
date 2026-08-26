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
    } catch (e) {
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
        <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          Development <span style={{ fontSize: "10px", background: "rgba(10,132,255,0.2)", color: "#0a84ff", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>AI MENTOR</span>
        </h2>
      </div>

      {/* Top Section: AI Engineering Assessment */}
      <div style={{ background: "rgba(10,132,255,0.05)", border: "1px solid rgba(10,132,255,0.2)", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🧠</span> AI Engineering Assessment
          </h3>
          <Button onClick={handleGetAssessment} disabled={assessmentLoading}>
            {assessmentLoading ? "Analyzing Metrics..." : (assessment ? "Refresh Assessment" : "Get Mentor Feedback")}
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
            Click "Get Mentor Feedback" to analyze your team's execution evidence (completed tasks, open bugs, PR cycle time) and receive actionable engineering guidance.
          </div>
        )}

        {!assessmentLoading && assessment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", padding: "4px 10px", borderRadius: "4px", background: assessment.status === 'Stable' ? 'rgba(50, 215, 75, 0.2)' : assessment.status === 'Needs Attention' ? 'rgba(255, 159, 10, 0.2)' : 'rgba(255, 69, 58, 0.2)', color: assessment.status === 'Stable' ? '#32d74b' : assessment.status === 'Needs Attention' ? '#ff9f0a' : '#ff453a' }}>
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
          <div className="workspace__card" style={{ padding: "16px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              Work items <span title="Number of stories, tasks, and bugs marked as 'Done' in the past 7 days" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "600" }}>{devMetrics?.completedThisWeek || 0}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Completed this week</div>
            </div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              Pull request cycle time <span title="Average time from first commit to PR merge in the last 7 days" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "600" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.prCycleTime ?? "0"}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Rolling 7-day median</div>
            </div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              Lead time for changes <span title="Average time between a commit and its deployment to production over the last 12 weeks" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "600" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.leadTimeForChanges ?? "0"}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Rolling 12-week average</div>
            </div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "16px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              Deployment frequency <span title="Average number of successful deployments to production per week" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "600" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.deploymentFrequency ?? "0"}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Weekly average</div>
            </div>
          </div>
        </div>

        {/* Bottom Row: 5 Small Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
          <div className="workspace__card" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Work items <span title="Items with a due date in the past that are not yet complete" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600", color: devMetrics?.overdueItems > 0 ? "#ff453a" : "inherit" }}>{devMetrics?.overdueItems || 0}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Overdue</div>
          </div>
          <div className="workspace__card" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Work items <span title="Items moved from 'Done' back to an active state" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>0</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Reopened</div>
          </div>
          <div className="workspace__card" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Bugs <span title="Unresolved bug tickets currently assigned to this project" style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "help" }}>ⓘ</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600", color: devMetrics?.openBugs > 0 ? "#ff9f0a" : "inherit" }}>{devMetrics?.openBugs || 0}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Open</div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "12px 16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Pull requests
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.openPullRequests ?? "0"}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Open</div>
          </div>
          <div className={`workspace__card ${!project?.githubIntegration?.isConnected ? "is-disconnected" : ""}`} style={{ padding: "12px 16px", opacity: project?.githubIntegration?.isConnected ? 1 : 0.6 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              Vulnerabilities
            </div>
            <div style={{ fontSize: "20px", fontWeight: "600", color: githubMetrics?.criticalVulnerabilities > 0 ? "#ff453a" : "inherit" }}>{githubLoading ? <Spinner size="sm" /> : githubMetrics?.criticalVulnerabilities ?? "0"}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Critical</div>
          </div>
        </div>
      </div>

      <div>
        {project?.githubIntegration?.isConnected ? (
          <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🐙</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Connected to GitHub</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
              Repository: <a href={`https://github.com/${project.githubIntegration.repoName}`} target="_blank" rel="noreferrer" style={{ color: "#0a84ff", textDecoration: "none" }}>{project.githubIntegration.repoName}</a>
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Button variant="secondary" onClick={() => fetchGitHubData && fetchGitHubData()}>
                Refresh Data
              </Button>
              <Button style={{ background: "transparent", border: "1px solid rgba(255,69,58,0.5)", color: "#ff453a" }} onClick={handleDisconnectGitHub}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "60px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px", background: "rgba(10,132,255,0.1)", padding: "16px", borderRadius: "50%" }}>🔌</div>
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
              label="GitHub Repository URL"
              value={githubForm.repoName}
              onChange={(e) => setGithubForm({ ...githubForm, repoName: e.target.value })}
              placeholder="e.g. https://github.com/facebook/react"
            />
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
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
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: "#0a84ff", textDecoration: "none" }}>Get a token</a> with 'repo' scope.
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
        confirmButtonStyle={{ background: "rgba(255,69,58,0.1)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.5)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
            Are you sure you want to disconnect <strong>{project?.githubIntegration?.repoName}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
            This will remove all GitHub-related metrics and pull request data from this project's dashboard. Your actual GitHub repository will not be modified.
          </p>
        </div>
      </Modal>
    </div>
  );
}
