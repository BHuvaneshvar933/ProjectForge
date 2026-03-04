import { Link } from 'react-router-dom';
import Badge from './Badge';
import './ProjectCard.css';

export default function ProjectCard({ project, type = "owned" }) {
  const {
    _id,
    title,
    description,
    status,
    projectType,
    currentTeamSize,
    teamSizeRequired,
    requiredSkills = [],
    owner
  } = project;

  return (
    <div className="project-card">
      {/* Header */}
      <div className="project-card__header">
        <h3 className="project-card__title">
          {title}
        </h3>
        <div className="project-card__badges">
          <Badge variant={projectType || 'default'}>
            {projectType}
          </Badge>
          <Badge variant={status}>
            {status}
          </Badge>
        </div>
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

      {/* Skills */}
      {requiredSkills.length > 0 && (
        <div className="project-card__skills">
          <div className="project-card__skills-list">
            {requiredSkills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="skill">{skill.name || skill}</Badge>
            ))}
            {requiredSkills.length > 3 && (
              <span className="project-card__skills-more">
                +{requiredSkills.length - 3}
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
        
        <Link to={`/projects/${_id}`}>
          <button className={`project-card__action ${type === "owned" ? 'project-card__action--ghost' : 'project-card__action--primary'}`.trim()}>
            {type === "owned" ? "Manage" : "View"}
          </button>
        </Link>
      </div>
    </div>
  );
}
