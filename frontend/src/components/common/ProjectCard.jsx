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
    commonCount,
    projectSkillCount,
    commonSkills = [],
    owner
  } = project;

  return (
    <div className="project-card">
      {/* Header with Title and Border */}
      <div className="project-card__header">
        <h3 className="project-card__title">
          {title}
        </h3>

      </div>

      {/* Description */}
      <p className="project-card__description">
        {description}
      </p>

      {/* Team Size - Visual Progress */}
      <div className="project-card__team">
        <div className="project-card__team-row">
          <span className="project-card__team-label">
            Team
          </span>
          <span className="project-card__team-value">
            {currentTeamSize}<span className="project-card__team-divider">/</span>{teamSizeRequired}
          </span>
        </div>
        <div className="project-card__progress">
          <div 
            className={`project-card__progress-fill ${currentTeamSize >= teamSizeRequired ? 'is-full' : 'is-active'}`.trim()}
            style={{ 
              width: `${Math.min((currentTeamSize / teamSizeRequired) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Status under Team line */}
      <div className="project-card__status-row">
        <Badge variant={status}>
          {status}
        </Badge>
        {typeof matchScore === "number" && type === "browse" && (
          <Badge variant="recruiting">Match: {Math.round(matchScore)}%</Badge>
        )}
      </div>

      {/* Skills or Match Breakdown */}
      {requiredSkills.length > 0 && (
        <div className="project-card__skills">
          {typeof matchScore === "number" && type === "browse" ? (
            <div className="project-card__match-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {projectSkillCount - commonCount === 1 ? '1 skill away from a full match' : 
                   projectSkillCount - commonCount === 0 ? 'Full skill match!' : 
                   `You have ${commonCount} of ${projectSkillCount} required skills`}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: matchScore >= 80 ? '#22c55e' : matchScore >= 50 ? '#eab308' : 'var(--text-secondary)' }}>
                  {Math.round(matchScore)}% Match
                </span>
              </div>
              <div className="project-card__skills-list" style={{ marginTop: '2px' }}>
                {requiredSkills.slice(0, 3).map((skill, i) => {
                  const isMatched = commonSkills?.some(cs => String(cs) === String(skill._id) || String(cs) === String(skill));
                  return (
                    <Badge 
                      key={i} 
                      variant="skill" 
                      style={isMatched ? { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' } : {}}
                    >
                      {isMatched && '✓ '}{displaySkillLabel(skill)}
                    </Badge>
                  );
                })}
                {requiredSkills.length > 3 && (
                  <span className="project-card__skills-more">
                    +{requiredSkills.length - 3}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="project-card__skills-list">
              {requiredSkills.slice(0, 3).map((skill, i) => (
                <Badge key={i} variant="skill">{displaySkillLabel(skill)}</Badge>
              ))}
              {requiredSkills.length > 3 && (
                <span className="project-card__skills-more">
                  +{requiredSkills.length - 3}
                </span>
              )}
            </div>
          )}
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
        
        <Link to={`/projects/${_id}`}>
          <button className={`project-card__action ${
            (window?.localStorage?.getItem("userId") === (owner?._id || owner)) 
              ? 'project-card__action--ghost' 
              : 'project-card__action--primary'
          }`.trim()}>
            {(window?.localStorage?.getItem("userId") === (owner?._id || owner)) 
              ? "Manage" 
              : "View"}
          </button>
        </Link>
      </div>
    </div>
  );
}
