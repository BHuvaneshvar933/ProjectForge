import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';

export default function ProjectHeader({
  project,
  tokenPresent,
  isMember,
  showPending,
  teamFull,
  isRecruiting,
  canApply,
  applyLoading,
  setShowApplyModal,
  isOwner,
  openRoles = [],
}) {
  const navigate = useNavigate();
  const { _id: id } = project;

  return (
    <div className="project-detail__header">
      {/* Title Banner with Apply Button */}
      <div className="project-detail__title-banner">
        <h2 className="project-detail__title">TITLE : {project.title}</h2>

        <div className="project-detail__header-action">
          {!tokenPresent && (
            <Button className="btn-apply-header" disabled>
              Sign in to apply
            </Button>
          )}

          {tokenPresent && showPending && (
            <Button variant="secondary" disabled style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
              Application Pending
            </Button>
          )}

          {tokenPresent && !isMember && !isOwner && !showPending && teamFull && (
            <Button variant="secondary" disabled style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
              Team Full
            </Button>
          )}

          {tokenPresent && !isMember && !isOwner && !showPending && !isRecruiting && (
            <Button variant="secondary" disabled style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
              Not recruiting
            </Button>
          )}

          {tokenPresent && canApply && (
            <Button
              className="btn-apply-header"
              onClick={() => setShowApplyModal(true)}
              loading={applyLoading}
            >
              Apply to Join
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons - only available when user joined or is owner */}
      {((tokenPresent && isMember) || isOwner) && (
        <div className="project-detail__actions-list">
          <button
            type="button"
            className="project-detail__action-btn"
            onClick={() => navigate(`/workspace/${id}`)}
          >
            Workspace
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                className="project-detail__action-btn"
                onClick={() => navigate(`/projects/${id}/applications`)}
              >
                View Applications
              </button>
              <button
                type="button"
                className="project-detail__action-btn"
                onClick={() => navigate(`/projects/${id}/edit`)}
              >
                Edit Project
              </button>
            </>
          )}
        </div>
      )}

      {/* 2 Rows of Details */}
      <div className="project-detail__details-container">
        <div className="project-detail__details-row">
          <div className="project-detail__detail-item">
            <span className="project-detail__detail-label">Topic :</span>
            <span className="project-detail__detail-value">{project.projectType || "General"}</span>
          </div>
          <div className="project-detail__detail-item">
            <span className="project-detail__detail-label">Status :</span>
            <span className="project-detail__detail-value">{project.status}</span>
          </div>
          <div className="project-detail__detail-item">
            <span className="project-detail__detail-label">Team :</span>
            <span className="project-detail__detail-value">
              {project.currentTeamSize} / {project.teamSizeRequired}
            </span>
          </div>
        </div>

        <div className="project-detail__details-row">
          <div className="project-detail__detail-item">
            <span className="project-detail__detail-label">Owner :</span>
            <span className="project-detail__detail-value">{project.owner?.name || "Unknown"}</span>
          </div>
          <div className="project-detail__detail-item">
            <span className="project-detail__detail-label">Open Roles :</span>
            <span className="project-detail__detail-value">
              {openRoles.length > 0 ? openRoles.join(", ") : "All filled"}
            </span>
          </div>
          <div className="project-detail__detail-item">
            <span className="project-detail__detail-label">Timeline :</span>
            <span className="project-detail__detail-value">
              {project.timeline?.startDate 
                ? `${new Date(project.timeline.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                : "Flexible"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
