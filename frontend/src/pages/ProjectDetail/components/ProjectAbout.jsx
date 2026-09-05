import { useState } from 'react';
import Badge from '../../../components/common/Badge';
import { displaySkillLabel } from '../../../utils/display';

export default function ProjectAbout({ project }) {
  const [expanded, setExpanded] = useState(false);
  
  const descriptionExpanded = expanded || project.description?.length < 300;

  return (
    <>
      {/* Section 3: Description */}
      <div className="project-detail__section">
        <h2 className="project-detail__section-title">About</h2>
        <div className="project-detail__card">
          <p className={`project-detail__description ${!descriptionExpanded ? 'is-clamped' : ''}`}>
            {project.description}
          </p>
          {project.description?.length > 300 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="project-detail__read-more"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* Section 4: Required Skills */}
      {project.requiredSkills?.length > 0 && (
        <div className="project-detail__section">
          <h2 className="project-detail__section-title">Required Skills</h2>
          <div className="project-detail__skills">
            {project.requiredSkills.map((skill, i) => (
              <Badge key={i} variant="skill">{displaySkillLabel(skill)}</Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
