import Badge from '../common/Badge';
import './ProjectReview.css';

export default function ProjectReview({ data }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="project-review">
      <div className="project-review__section project-review__section--title">
        <h3 className="project-review__label">Project Title</h3>
        <p className="project-review__title">{data.title || 'Not provided'}</p>
      </div>

      <div className="project-review__section">
        <h3 className="project-review__label">Description</h3>
        <p className="project-review__text">{data.description || 'Not provided'}</p>
      </div>

      <div className="project-review__grid">
        <div className="project-review__card">
          <h3 className="project-review__label">Project Type</h3>
          {data.projectType ? (
            <Badge variant={data.projectType}>{data.projectType}</Badge>
          ) : (
            <p className="project-review__muted">Not specified</p>
          )}
        </div>
        
        <div className="project-review__card">
          <h3 className="project-review__label">Team Size</h3>
          <p className="project-review__size">
            {data.teamSizeRequired}
            <span className="project-review__size-unit">members</span>
          </p>
        </div>
      </div>

      <div className="project-review__section">
        <h3 className="project-review__label">Your Role</h3>
        <p className="project-review__role">{data.ownerRole || 'Not specified'}</p>
      </div>

      <div className="project-review__section">
        <h3 className="project-review__label">Required Skills</h3>
        <div className="project-review__skills">
          {data.requiredSkills.length > 0 ? (
            data.requiredSkills.map(skill => (
              <Badge key={skill} variant="skill">{skill}</Badge>
            ))
          ) : (
            <p className="project-review__muted">No skills added</p>
          )}
        </div>
      </div>

      {(data.timeline.startDate || data.timeline.endDate) && (
        <div className="project-review__section">
          <h3 className="project-review__label">Timeline</h3>
          <div className="project-review__timeline">
            {data.timeline.startDate && (
              <div className="project-review__timeline-item">
                <span className="project-review__timeline-label">Start</span>
                <span className="project-review__timeline-value">{formatDate(data.timeline.startDate)}</span>
              </div>
            )}
            {data.timeline.endDate && (
              <>
                <span className="project-review__timeline-arrow">→</span>
                <div className="project-review__timeline-item">
                  <span className="project-review__timeline-label">End</span>
                  <span className="project-review__timeline-value">{formatDate(data.timeline.endDate)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {data.openRoles.length > 0 && (
        <div className="project-review__section">
          <h3 className="project-review__label">Open Roles</h3>
          <div className="project-review__skills">
            {data.openRoles.map(role => (
              <Badge key={role} variant="skill">{role}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}