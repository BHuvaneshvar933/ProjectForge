export default function ProjectTimeline({ project }) {
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
        <div className="project-detail__timeline-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {startDate && (
            <div className="project-detail__timeline-block">
              <div className="project-detail__timeline-label">Start Date</div>
              <div className="project-detail__timeline-value">
                {startDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
          {endDate && (
            <div className="project-detail__timeline-block">
              <div className="project-detail__timeline-label">End Date</div>
              <div className="project-detail__timeline-value">
                {endDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
          {duration && (
            <div className="project-detail__timeline-block">
              <div className="project-detail__timeline-label">Duration</div>
              <div className="project-detail__timeline-value">{duration} days</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
