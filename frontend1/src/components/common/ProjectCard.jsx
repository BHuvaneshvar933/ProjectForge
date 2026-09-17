import { Link } from 'react-router-dom';
import Badge from './Badge';
import './ProjectCard.css';
import { displaySkillLabel } from '../../utils/display';

export default function ProjectCard({ project, type = "owned" }) {
  const {
    _id,
    title,
    description,
    status,
    currentTeamSize,
    teamSizeRequired,
    requiredSkills = [],
    matchScore,
    commonSkills = [],
    owner
  } = project;

  const targetTeamSize = teamSizeRequired ?? currentTeamSize ?? 0;
  const openPositions = Math.max(0, (teamSizeRequired ?? 0) - (currentTeamSize ?? 0));
  const isOwner = window?.localStorage?.getItem("userId") === (owner?._id || owner);

  return (
    <div className="project-card">
      {/* Header Banner - Solid Color */}
      <div className="project-card__header">
        <h3 className="project-card__title" title={title}>
          {title}
        </h3>
      </div>

      {/* Card Body */}
      <div className="project-card__body">
        {/* Team Size, Positions Open & Match Score */}
        <div className="project-card__stats-row">
          <div className="project-card__stat-col">
            <span className="project-card__stat-label">Team Size</span>
            <span className="project-card__stat-value">{targetTeamSize}</span>
          </div>
          <div className="project-card__stat-divider" />
          <div className="project-card__stat-col">
            <span className="project-card__stat-label">Positions Open</span>
            <span className="project-card__stat-value">{openPositions}</span>
          </div>
          {typeof matchScore === "number" && type === "browse" && (
            <>
              <div className="project-card__stat-divider" />
              <div className="project-card__stat-col">
                <span className="project-card__stat-label">Match</span>
                <span className="project-card__stat-value">
                  {Math.round(matchScore)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Status Badge as how it was before */}
        <div className="project-card__status-row">
          <Badge variant={status}>
            {status}
          </Badge>
        </div>

        {/* Skills Required */}
        {requiredSkills.length > 0 && (
          <div className="project-card__skills-section">
            <div className="project-card__skills-pill">
              {requiredSkills.slice(0, 5).map((skill, i) => {
                const isMatched = commonSkills?.some(cs => String(cs) === String(skill._id) || String(cs) === String(skill));
                return (
                  <span key={i} className={`project-card__skill-item ${isMatched ? 'is-matched' : ''}`}>
                    <span className="project-card__skill-name">{displaySkillLabel(skill)}</span>
                    {i < Math.min(requiredSkills.length, 5) - 1 && (
                      <span className="project-card__skill-slash">/</span>
                    )}
                  </span>
                );
              })}
              {requiredSkills.length > 5 && (
                <span className="project-card__skills-more">
                  +{requiredSkills.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="project-card__footer">
          <div className="project-card__owner">
            <div className="project-card__owner-avatar">
              <span className="project-card__owner-initial">
                {owner?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="project-card__owner-name">
              {owner?.name || 'Unknown'}
            </span>
          </div>

          <Link to={`/projects/${_id}`} className="project-card__action-link">
            <button className="project-card__action">
              <span>{isOwner ? "Manage" : "View Details"}</span>
              <svg className="project-card__action-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
