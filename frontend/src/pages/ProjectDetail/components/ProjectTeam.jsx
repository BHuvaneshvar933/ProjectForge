import Badge from '../../../components/common/Badge';

export default function ProjectTeam({ project, team, openRoles }) {
  return (
    <>
      {/* Section 2: Owner Info */}
      <div className="project-detail__section">
        <h2 className="project-detail__section-title">Project Owner</h2>
        <div className="project-detail__card project-detail__owner">
          <div className="project-detail__owner-avatar">
            <span className="project-detail__owner-initial">{project.owner?.name?.[0] || 'U'}</span>
          </div>
          <div className="project-detail__owner-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="project-detail__owner-name">{project.owner?.name || 'Unknown'}</span>
              <Badge variant="owner">owner</Badge>
            </div>
            <div className="project-detail__owner-bio">{project.owner?.bio || 'No bio'}</div>
          </div>
        </div>
      </div>

      {/* Section 6: Team Section */}
      <div className="project-detail__section">
        <h2 className="project-detail__section-title">
          Team <span className="project-detail__section-count">({team.length} / {project.teamSizeRequired})</span>
        </h2>
        <div className="project-detail__team-grid">
          {team.map((member, idx) => (
            <div key={`${member.name || 'member'}-${idx}`} className="project-detail__card project-detail__team-card">
              <div className="project-detail__team-row">
                <div className="project-detail__team-info">
                  <div className="project-detail__team-avatar">
                    <span className="project-detail__team-initial">{member.name?.[0] || 'U'}</span>
                  </div>
                  <div className="project-detail__team-meta">
                    <span className="project-detail__team-name">{member.name || 'Unknown'}</span>
                    <span className="project-detail__team-role">• {member.projectRole || 'Member'}</span>
                    <Badge variant={member.role}>{member.role || 'member'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: Open Roles */}
      <div className="project-detail__section">
        <h2 className="project-detail__section-title">Open Roles</h2>
        {openRoles.length === 0 ? (
          <div className="project-detail__card">
            <p className="project-detail__empty">No open roles listed.</p>
          </div>
        ) : (
          <div className="project-detail__roles">
            {openRoles.map((role, i) => (
              <Badge key={`${role}-${i}`} variant="skill">{role}</Badge>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
