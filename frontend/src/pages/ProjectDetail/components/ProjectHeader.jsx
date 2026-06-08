import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

export default function ProjectHeader({
  project,
  matchPercent,
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
  setShowArchiveModal,
}) {
  const navigate = useNavigate();
  const { _id: id } = project;

  return (
    <div className="project-detail__header">
      <div>
        <h1 className="project-detail__title">{project.title}</h1>
        <div className="project-detail__badges">
          <Badge variant={project.projectType}>{project.projectType}</Badge>
          <Badge variant={project.status}>{project.status}</Badge>
          {typeof matchPercent === "number" && (
            <Badge variant="recruiting">Match: {matchPercent}%</Badge>
          )}
          <Badge variant="default">
            Team: {project.currentTeamSize} / {project.teamSizeRequired}
          </Badge>
        </div>
      </div>

      <div className="project-detail__actions">
        {!tokenPresent && (
          <Button variant="primary" disabled>
            Sign in to apply
          </Button>
        )}

        {tokenPresent && isMember && (
          <Button variant="primary" onClick={() => navigate(`/workspace/${id}`)}>
            Workspace
          </Button>
        )}

        {tokenPresent && showPending && (
          <Button variant="secondary" disabled>
            Application Pending
          </Button>
        )}

        {tokenPresent && !isMember && !isOwner && !showPending && teamFull && (
          <Button variant="secondary" disabled>
            Team Full
          </Button>
        )}

        {tokenPresent && !isMember && !isOwner && !showPending && !isRecruiting && (
          <Button variant="secondary" disabled>
            Not recruiting
          </Button>
        )}

        {tokenPresent && canApply && (
          <Button
            variant="primary"
            onClick={() => setShowApplyModal(true)}
            loading={applyLoading}
          >
            Apply to Join
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
            <Button variant="danger" onClick={() => setShowArchiveModal(true)}>
              Archive
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
