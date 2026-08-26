import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import DashboardPagination from "../../components/common/DashboardPagination";
import { displaySkillLabel } from "../../utils/display";
import {
  acceptApplication,
  getProjectApplications,
  rejectApplication,
} from "../../api/applicationApi";
import { getProjectById } from "../../api/projectApi";
import "./applications.css";

export default function ProjectApplications() {
  const { id } = useParams();
  const projectId = id;

  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filter, setFilter] = useState("all");

  const [busyId, setBusyId] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [acceptState, setAcceptState] = useState({ id: "", projectRole: "" });

  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, appsRes] = await Promise.all([
        getProjectById(projectId),
        getProjectApplications(projectId, { page, limit: 10, status: filter === "all" ? undefined : filter }),
      ]);

      setProject(projRes.data?.data?.project ?? null);

      const applications = appsRes.data?.data?.applications ?? appsRes.data?.data?.result?.applications;
      const meta = appsRes.data?.data?.pagination ?? appsRes.data?.data?.result?.pagination;
      setItems(Array.isArray(applications) ? applications : []);
      setPagination(meta || { page, pages: 1, total: 0, limit: 10 });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load applications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter, projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statusVariant = useMemo(() => {
    return {
      pending: "pending",
      accepted: "accepted",
      rejected: "rejected",
      withdrawn: "withdrawn",
    };
  }, []);


  const onAccept = async () => {
    const applicationId = acceptState.id;
    if (!applicationId) return;
    setBusyId(applicationId);
    try {
      await acceptApplication(applicationId, acceptState.projectRole || undefined);
      toast.success("Application accepted");
      setAcceptState({ id: "", projectRole: "" });
      await fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to accept application");
    } finally {
      setBusyId("");
    }
  };

  const onReject = async () => {
    if (!rejectId) return;
    setRejectLoading(true);
    try {
      await rejectApplication(rejectId, rejectReason.trim());
      toast.success("Application rejected");
      setRejectId("");
      setRejectReason("");
      await fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to reject application");
    } finally {
      setRejectLoading(false);
    }
  };

  const filteredItems = items;

  if (loading) {
    return (
      <div className="dashboard-page" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'rgba(255, 255, 255, 0.82)', marginTop: 16 }}>Loading project applications...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Applications</h1>
          <p className="dashboard-subtitle">
            {project?.title ? `For: ${project.title}` : "Review applications for this project."}
          </p>
        </div>
        <Link to={`/projects/${projectId}`}>
          <Button variant="secondary" className="dashboard-header__btn">Back to Project</Button>
        </Link>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar__section">
            <h3 className="dashboard-sidebar__heading">Status</h3>
            <div className="dashboard-sidebar__tabs">
              {['all', 'pending', 'accepted', 'rejected', 'withdrawn'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(1);
                  }}
                  className={`dashboard-sidebar__tab ${filter === status ? 'is-active' : ''}`.trim()}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="dashboard-content">
          {filteredItems.length === 0 ? (
            <div className="apps-empty">
              <p className="apps-empty__title">No applications found</p>
              <p className="apps-empty__subtitle">You don't have any applications with this status.</p>
            </div>
          ) : (
            <div className="apps-list">
              {filteredItems.map((a) => {
            const applicant = a?.applicantId;
            const skills = Array.isArray(applicant?.skills) ? applicant.skills : [];
            const disabled = busyId === a._id;
            return (
              <div key={a._id} className="apps-card">
                <div className="apps-card__top">
                  <div>
                    <div className="apps-card__title">{applicant?.name || "Applicant"}</div>
                    <div className="apps-card__meta">
                      <span className="apps-card__meta-item">{a?.applicationType === "invitation" ? "Invitation" : "Application"}</span>
                      <span className="apps-card__meta-item">Match: {typeof a.matchScore === "number" ? `${a.matchScore}%` : "-"}</span>
                      <span className="apps-card__meta-item">Sent: {a?.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}</span>
                    </div>
                  </div>
                  <div className="apps-card__badges">
                    <Badge variant={statusVariant[a.status] || "default"}>{a.status}</Badge>
                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="apps-card__skills">
                    {skills.slice(0, 8).map((s) => (
                      <Badge key={s?._id || s?.name} variant="skill">
                        {displaySkillLabel(s)}
                      </Badge>
                    ))}
                    {skills.length > 8 && <span className="apps-card__skills-more">+{skills.length - 8}</span>}
                  </div>
                )}

                {a?.message && (
                  <div className="apps-card__message">
                    <div className="apps-card__message-label">{a?.applicationType === "invitation" ? "Invitation Note" : "Application Note"}</div>
                    <div className="apps-card__message-text">{a.message}</div>
                  </div>
                )}

                {a?.invitedRole && (
                  <div className="apps-card__message">
                    <div className="apps-card__message-label">Suggested role</div>
                    <div className="apps-card__message-text">{a.invitedRole}</div>
                  </div>
                )}

                {a?.status === "pending" && a?.applicationType !== "invitation" ? (
                  <div className="apps-card__actions">
                    <Button variant="outline" onClick={() => setProfileUser(applicant)}>
                      View Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          // Ensure we only pass projectId and applicantId as spec requires
                          // I'll dynamically import messageApi here to avoid breaking top-level imports
                          const { startConversation } = await import("../../api/messageApi");
                          const res = await startConversation({ projectId, applicantId: applicant._id });
                          const conversationId = res.data.data._id;
                          
                          const event = new CustomEvent("open-dm", { 
                            detail: { 
                              conversationId,
                              userId: applicant._id, 
                              name: applicant.name, 
                              avatar: applicant.avatar 
                            } 
                          });
                          window.dispatchEvent(event);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || "Failed to start conversation");
                        }
                      }}
                    >
                      Message
                    </Button>
                    <Button
                      variant="primary"
                      loading={disabled}
                      onClick={() => setAcceptState({ id: a._id, projectRole: a?.invitedRole || "" })}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      disabled={disabled}
                      onClick={() => setRejectId(a._id)}
                    >
                      Reject
                    </Button>
                  </div>
                ) : a?.status === "pending" ? (
                  <div className="apps-card__actions">
                    <Button variant="outline" disabled>
                      Invitation Sent
                    </Button>
                  </div>
                ) : (
                  <div className="apps-card__actions">
                    <Button variant="outline" disabled>
                      Decision Recorded
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <DashboardPagination 
          page={page} 
          totalPages={pagination?.pages || 1} 
          setPage={setPage} 
        />
      )}
      </main>
      </div>

      <Modal
        isOpen={Boolean(profileUser)}
        onClose={() => setProfileUser(null)}
        title={profileUser?.name ? `${profileUser.name}'s Profile` : "Applicant Profile"}
      >
        {profileUser && (
          <div className="apps-profile">
            <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: 13, lineHeight: 1.6 }}>{profileUser.bio || "No bio provided."}</p>
            <div className="apps-profile__grid">
              <div><strong>Email:</strong> {profileUser.email || "-"}</div>
              <div><strong>Availability:</strong> {profileUser.availabilityHoursPerWeek ?? 0} hrs/week</div>
              <div><strong>Projects Active:</strong> {profileUser?.stats?.projectsActive ?? 0}</div>
              <div><strong>Projects Completed:</strong> {profileUser?.stats?.projectsCompleted ?? 0}</div>
              <div><strong>Tasks Completed:</strong> {profileUser?.stats?.tasksCompleted ?? 0}</div>

              <div><strong>Acceptance Rate:</strong> {profileUser?.stats?.acceptanceRate ? `${(profileUser.stats.acceptanceRate * 100).toFixed(0)}%` : "0%"}</div>
              <div><strong>Member Since:</strong> {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : "-"}</div>
            </div>

            {profileUser.portfolioLinks && Object.values(profileUser.portfolioLinks).some(Boolean) && (
              <div className="apps-profile__links" style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                {profileUser.portfolioLinks.github && (
                  <a href={profileUser.portfolioLinks.github.startsWith('http') ? profileUser.portfolioLinks.github : `https://${profileUser.portfolioLinks.github}`} target="_blank" rel="noreferrer" className="apps-role-chip" style={{textDecoration: 'none', color: '#3A3635', borderColor: 'rgba(58, 54, 53, 0.3)'}}>GitHub</a>
                )}
                {profileUser.portfolioLinks.linkedin && (
                  <a href={profileUser.portfolioLinks.linkedin.startsWith('http') ? profileUser.portfolioLinks.linkedin : `https://${profileUser.portfolioLinks.linkedin}`} target="_blank" rel="noreferrer" className="apps-role-chip" style={{textDecoration: 'none', color: '#3A3635', borderColor: 'rgba(58, 54, 53, 0.3)'}}>LinkedIn</a>
                )}
                {profileUser.portfolioLinks.website && (
                  <a href={profileUser.portfolioLinks.website.startsWith('http') ? profileUser.portfolioLinks.website : `https://${profileUser.portfolioLinks.website}`} target="_blank" rel="noreferrer" className="apps-role-chip" style={{textDecoration: 'none', color: '#3A3635', borderColor: 'rgba(58, 54, 53, 0.3)'}}>Website</a>
                )}
              </div>
            )}
            {Array.isArray(profileUser.skills) && profileUser.skills.length > 0 && (
              <div className="apps-card__skills">
                {profileUser.skills.map((s) => (
                  <Badge key={s?._id || s?.name} variant="skill">{displaySkillLabel(s)}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(acceptState.id)}
        onClose={() => setAcceptState({ id: "", projectRole: "" })}
        title="Accept application"
        onConfirm={onAccept}
        confirmText={busyId === acceptState.id ? "Accepting..." : "Accept"}
      >
        <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Choose the role this person should get in the project.</p>
        <input
          className="apps-textarea apps-textarea--single"
          value={acceptState.projectRole}
          onChange={(e) => setAcceptState((prev) => ({ ...prev, projectRole: e.target.value }))}
          placeholder={project?.openRoles?.[0] || "Example: Frontend Developer"}
        />
        {Array.isArray(project?.openRoles) && project.openRoles.length > 0 && (
          <div className="apps-card__skills" style={{ marginTop: 12 }}>
            {project.openRoles.map((role) => (
              <button
                key={role}
                type="button"
                className="apps-role-chip"
                onClick={() => setAcceptState((prev) => ({ ...prev, projectRole: role }))}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(rejectId)}
        onClose={() => {
          setRejectId("");
          setRejectReason("");
        }}
        title="Reject application"
        onConfirm={onReject}
        confirmText={rejectLoading ? "Rejecting..." : "Reject"}
      >
        <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Optionally provide a reason (visible to the applicant).</p>
        <textarea
          className="apps-textarea"
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Example: Looking for someone with stronger backend experience"
        />
      </Modal>
    </div>
  );
}
