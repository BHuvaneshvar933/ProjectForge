export default function ProjectTimeline({ project }) {
  // Calculate duration
  const startDate = project.timeline?.startDate ? new Date(project.timeline.startDate) : null;
  const endDate = project.timeline?.endDate ? new Date(project.timeline.endDate) : null;
  const duration = startDate && endDate
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    : null;

  if (!startDate && !endDate) return null;

  return (
    <div className="project-detail__section">
      <h2 className="project-detail__section-title">Timeline</h2>
      <div className="project-detail__card">
        <div className="project-detail__timeline-grid">
          {startDate && (
            <div className="project-detail__timeline-item">
              <div className="project-detail__timeline-label">Start Date</div>
              <div className="project-detail__timeline-value">{startDate.toLocaleDateString()}</div>
            </div>
          )}
          {endDate && (
            <div className="project-detail__timeline-item">
              <div className="project-detail__timeline-label">End Date</div>
              <div className="project-detail__timeline-value">{endDate.toLocaleDateString()}</div>
            </div>
          )}
          {duration && (
            <div className="project-detail__timeline-item">
              <div className="project-detail__timeline-label">Duration</div>
              <div className="project-detail__timeline-value">{duration} days</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
