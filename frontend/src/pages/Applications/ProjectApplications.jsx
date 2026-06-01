import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
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

  const [busyId, setBusyId] = useState("");

  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, appsRes] = await Promise.all([
        getProjectById(projectId),
        getProjectApplications(projectId, { page, limit: 10 }),
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
  }, [page, projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statusVariant = useMemo(() => {
    return {
      pending: "recruiting",
      accepted: "completed",
      rejected: "archived",
      withdrawn: "default",
    };
  }, []);

  const canPrev = page > 1;
  const canNext = page < (pagination?.pages || 1);

  const onAccept = async (applicationId) => {
    if (!applicationId) return;
    setBusyId(applicationId);
    try {
      await acceptApplication(applicationId);
      toast.success("Application accepted");
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

  if (loading) {
    return (
      <div className="apps-page apps-page--loading">
        <Spinner size="lg" />
        <p className="apps-page__hint">Loading project applications...</p>
      </div>
    );
  }

  return (
    <div className="apps-page">
      <div className="apps-page__header">
        <div>
          <h1 className="apps-page__title">Applications</h1>
          <p className="apps-page__subtitle">
            {project?.title ? `For: ${project.title}` : "Review applications for this project."}
          </p>
        </div>
        <Link to={`/projects/${projectId}`}>
          <Button variant="secondary">Back to Project</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="apps-empty">
          <p className="apps-empty__title">No applications received</p>
          <p className="apps-empty__subtitle">When students apply, they will appear here.</p>
        </div>
      ) : (
        <div className="apps-list">
          {items.map((a) => {
            const applicant = a?.applicantId;
            const skills = Array.isArray(applicant?.skills) ? applicant.skills : [];
            const disabled = busyId === a._id;
            return (
              <div key={a._id} className="apps-card">
                <div className="apps-card__top">
                  <div>
                    <div className="apps-card__title">{applicant?.name || "Applicant"}</div>
                    <div className="apps-card__meta">
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
                    <div className="apps-card__message-label">Message</div>
                    <div className="apps-card__message-text">{a.message}</div>
                  </div>
                )}

                {a?.status === "pending" ? (
                  <div className="apps-card__actions">
                    <Button
                      variant="primary"
                      loading={disabled}
                      onClick={() => onAccept(a._id)}
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
        <div className="apps-page__pager">
          <Button variant="ghost" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <div className="apps-page__pager-text">
            Page {page} of {pagination?.pages || 1}
          </div>
          <Button variant="ghost" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

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
        <p className="apps-page__hint">Optionally provide a reason (visible to the applicant).</p>
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
