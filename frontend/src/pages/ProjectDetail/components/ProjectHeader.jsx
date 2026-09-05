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
  goToApplications,
}) {
  const navigate = useNavigate();
  const { _id: id } = project;

  return (
    <div className="project-detail__header">
      {/* 1. Full Bleed Black Title Banner with Apply to Join inside Header at Right-Most */}
      <div className="project-detail__title-banner">
        <h1 className="project-detail__title">{project.title}</h1>

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

      {/* 2. Action Buttons under Header (Workspace, View Applications, Edit Project) */}
      {(isMember || isOwner) && (
        <div className="project-detail__actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '14px 0 16px' }}>
          {tokenPresent && isMember && (
            <Button variant="primary" onClick={() => navigate(`/workspace/${id}`)}>
              Workspace
            </Button>
          )}

          {isOwner && (
            <>
              <Button variant="outline" onClick={goToApplications}>
                View Applications
              </Button>
              <Link to={`/projects/${id}/edit`}>
                <Button variant="secondary">Edit Project</Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* 3. Vertically Stacked Metadata Badges with status text colors */}
      <div className="project-detail__badges">
        <div className="project-detail__badge-item">
          <span className="project-detail__badge-label">topic :</span>
          <span className="project-detail__badge-value">{project.projectType || "General"}</span>
        </div>
        <div className="project-detail__badge-item">
          <span className="project-detail__badge-label">status :</span>
          <span className={`project-detail__status-text status-text--${project.status}`}>
            {project.status}
          </span>
        </div>
        <div className="project-detail__badge-item">
          <span className="project-detail__badge-label">team :</span>
          <span className="project-detail__badge-value">
            {project.currentTeamSize} / {project.teamSizeRequired}
          </span>
        </div>
      </div>
    </div>
  );
}
