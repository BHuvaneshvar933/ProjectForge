import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import { getMyApplications, withdrawApplication } from "../../api/applicationApi";
import "./applications.css";

export default function MyApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });

  const [withdrawId, setWithdrawId] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchMyApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyApplications({ page, limit: 10 });
      const applications = res.data?.data?.applications ?? res.data?.data?.result?.applications;
      const meta = res.data?.data?.pagination ?? res.data?.data?.result?.pagination;

      setItems(Array.isArray(applications) ? applications : []);
      setPagination(meta || { page, pages: 1, total: 0, limit: 10 });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load applications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  const canPrev = page > 1;
  const canNext = page < (pagination?.pages || 1);

  const statusVariant = useMemo(() => {
    return {
      pending: "recruiting",
      accepted: "completed",
      rejected: "archived",
      withdrawn: "default",
    };
  }, []);

  const onWithdraw = async () => {
    if (!withdrawId) return;
    setWithdrawLoading(true);
    try {
      await withdrawApplication(withdrawId);
      toast.success("Application withdrawn");
      setWithdrawId("");
      await fetchMyApplications();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to withdraw application");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="apps-page apps-page--loading">
        <Spinner size="lg" />
        <p className="apps-page__hint">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="apps-page">
      <div className="apps-page__header">
        <div>
          <h1 className="apps-page__title">My Applications</h1>
          <p className="apps-page__subtitle">Track the projects you applied to and their status.</p>
        </div>
        <Link to="/projects">
          <Button variant="secondary">Browse Projects</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="apps-empty">
          <p className="apps-empty__title">No applications yet</p>
          <p className="apps-empty__subtitle">Apply to a recruiting project to see it here.</p>
          <Link to="/projects">
            <button className="apps-empty__action">Explore Projects</button>
          </Link>
        </div>
      ) : (
        <div className="apps-list">
          {items.map((a) => {
            const project = a?.projectId;
            const projectId = project?._id || a?.projectId;
            return (
              <div key={a._id} className="apps-card">
                <div className="apps-card__top">
                  <div>
                    <div className="apps-card__title">
                      <Link to={`/projects/${projectId}`}>{project?.title || "Project"}</Link>
                    </div>
                    <div className="apps-card__meta">
                      <span className="apps-card__meta-item">Owner: {project?.owner?.name || "-"}</span>
                      <span className="apps-card__meta-item">Match: {typeof a.matchScore === "number" ? `${a.matchScore}%` : "-"}</span>
                    </div>
                  </div>
                  <div className="apps-card__badges">
                    <Badge variant={statusVariant[a.status] || "default"}>{a.status}</Badge>
                    {project?.status && (
                      <Badge variant={project.status}>{project.status}</Badge>
                    )}
                  </div>
                </div>

                {a?.message && (
                  <div className="apps-card__message">
                    <div className="apps-card__message-label">Your note</div>
                    <div className="apps-card__message-text">{a.message}</div>
                  </div>
                )}

                {a?.status === "rejected" && a?.rejectionReason && (
                  <div className="apps-card__rejection">
                    <div className="apps-card__message-label">Rejection reason</div>
                    <div className="apps-card__message-text">{a.rejectionReason}</div>
                  </div>
                )}

                <div className="apps-card__actions">
                  <Link to={`/projects/${projectId}`}>
                    <Button variant="outline">Open Project</Button>
                  </Link>
                  {a?.status === "pending" && (
                    <Button variant="danger" onClick={() => setWithdrawId(a._id)}>
                      Withdraw
                    </Button>
                  )}
                </div>
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
        isOpen={Boolean(withdrawId)}
        onClose={() => setWithdrawId("")}
        title="Withdraw application?"
        onConfirm={onWithdraw}
        confirmText={withdrawLoading ? "Withdrawing..." : "Withdraw"}
      >
        <p className="apps-page__hint">
          This will withdraw your pending application. You can apply again later if the project is still recruiting.
        </p>
      </Modal>
    </div>
  );
}
