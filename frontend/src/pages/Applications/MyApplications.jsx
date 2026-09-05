import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import DashboardPagination from "../../components/common/DashboardPagination";
import PageHeader from "../../components/common/PageHeader";
import { getMyApplications, respondToInvitation, withdrawApplication } from "../../api/applicationApi";
import { getSocket } from "../../realtime/socketClient";
import "./applications.css";

export default function MyApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filter, setFilter] = useState("all");

  const [withdrawId, setWithdrawId] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [respondingId, setRespondingId] = useState("");

  const fetchMyApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyApplications({ page, limit: 10, status: filter === "all" ? undefined : filter });
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
  }, [page, filter]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleApplicationUpdated = (updatedApp) => {
      setItems((prev) => 
        prev.map(a => a._id === updatedApp._id ? { ...a, status: updatedApp.status } : a)
      );
    };

    socket.on("application-updated", handleApplicationUpdated);
    return () => {
      socket.off("application-updated", handleApplicationUpdated);
    };
  }, []);



  const onWithdraw = async () => {
    if (!withdrawId) return;
    setWithdrawLoading(true);
    try {
      await withdrawApplication(withdrawId);
      toast.success("Application withdrawn");
      setItems(prev => prev.map(a => a._id === withdrawId ? { ...a, status: "withdrawn" } : a));
      setWithdrawId("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to withdraw application");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const onRespondToInvite = async (applicationId, action) => {
    if (!applicationId) return;
    setRespondingId(applicationId);
    try {
      await respondToInvitation(applicationId, action);
      toast.success(action === "accept" ? "Invitation accepted" : "Invitation declined");
      setItems(prev => prev.map(a => a._id === applicationId ? { ...a, status: action === "accept" ? "accepted" : "rejected" } : a));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to respond to invitation");
    } finally {
      setRespondingId("");
    }
  };

  const filteredItems = items;

  if (loading) {
    return (
      <div className="dashboard-page" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
        <p style={{ color: 'var(--color-text-dark)', marginTop: 16, fontWeight: 500 }}>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title="My Applications"
        actions={
          <Link to="/projects">
            <Button variant="secondary" className="dashboard-header__btn">Browse Projects</Button>
          </Link>
        }
      />

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
              <p className="apps-empty__subtitle">You haven't received or sent any applications with this status.</p>
              <Link to="/projects">
                <button className="apps-empty__action">Explore Projects</button>
              </Link>
            </div>
          ) : (
            <div className="apps-list">
              {filteredItems.map((a) => {
            const project = a?.projectId;
            const projectId = project?._id || a?.projectId;
            const isInvitation = a?.applicationType === "invitation";
            return (
              <div key={a._id} className="apps-card">
                {/* Topic Header with Border under it */}
                <div className="apps-card__header">
                  <div className="apps-card__title">
                    <Link to={`/projects/${projectId}`}>{project?.title || "Project"}</Link>
                  </div>
                </div>

                {/* Owner & Match Meta */}
                <div className="apps-card__meta-section">
                  <div className="apps-card__meta">
                    <span className="apps-card__meta-item">Owner: {project?.owner?.name || "-"}</span>
                    {isInvitation && (
                      <span className="apps-card__meta-item">Invited by: {a?.invitedBy?.name || project?.owner?.name || "-"}</span>
                    )}
                    <span className="apps-card__meta-item">Match: {typeof a.matchScore === "number" ? `${a.matchScore}%` : "-"}</span>
                  </div>
                  <div className="apps-card__status-row">
                    <Badge variant={a.status}>{a.status}</Badge>
                  </div>
                </div>

                {isInvitation && a?.invitedRole && (
                  <div className="apps-card__message">
                    <div className="apps-card__message-label">Suggested role</div>
                    <div className="apps-card__message-text">{a.invitedRole}</div>
                  </div>
                )}

                {a?.message && (
                  <div className="apps-card__message">
                    <div className="apps-card__message-label">{isInvitation ? "Invitation note" : "Your note"}</div>
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
                  {a?.status === "pending" && isInvitation && (
                    <>
                      <Button
                        variant="primary"
                        loading={respondingId === a._id}
                        onClick={() => onRespondToInvite(a._id, "accept")}
                      >
                        Accept Invite
                      </Button>
                      <Button
                        variant="danger"
                        disabled={respondingId === a._id}
                        onClick={() => onRespondToInvite(a._id, "reject")}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {a?.status === "pending" && !isInvitation && (
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
        <DashboardPagination 
          page={page} 
          totalPages={pagination?.pages || 1} 
          setPage={setPage} 
        />
      )}
      </main>
      </div>

      <Modal
        isOpen={Boolean(withdrawId)}
        onClose={() => setWithdrawId("")}
        title="Withdraw application?"
        onConfirm={onWithdraw}
        confirmText={withdrawLoading ? "Withdrawing..." : "Withdraw"}
      >
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          This will withdraw your pending application. You can apply again later if the project is still recruiting.
        </p>
      </Modal>
    </div>
  );
}
