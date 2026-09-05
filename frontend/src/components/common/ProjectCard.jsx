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
    projectType,
    currentTeamSize,
    teamSizeRequired,
    requiredSkills = [],
    matchScore,
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
