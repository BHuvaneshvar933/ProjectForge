import { useState } from 'react';
import Badge from '../../../components/common/Badge';
import { displaySkillLabel } from '../../../utils/display';

export default function ProjectAbout({ project, tokenPresent, skillMatchScore }) {
  const [expanded, setExpanded] = useState(false);
  
  const descriptionExpanded = expanded || project.description?.length < 300;

  return (
    <>
      {(tokenPresent && skillMatchScore !== null) && (
        <div className="project-detail__section">
          <h2 className="project-detail__section-title">Your Match</h2>
          <div className="project-detail__card">
            <div className="project-detail__match">
              <div>
                <div className="project-detail__match-score">{skillMatchScore}%</div>
                <div className="project-detail__match-sub">based on skill overlap</div>
              </div>
              <Badge variant={skillMatchScore >= 70 ? 'recruiting' : 'default'}>
                {skillMatchScore >= 70 ? 'Strong match' : 'Potential match'}
              </Badge>
            </div>
          </div>
        </div>
      )}

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

      {/* Section 5: Timeline */}
      {(project.timeline?.startDate || project.timeline?.endDate) && (
        <div className="project-detail__section">
          <h2 className="project-detail__section-title">Project Timeline</h2>
          <div className="project-detail__card" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {project.timeline.startDate && (
              <div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>Start Date</div>
                <div style={{ fontWeight: 600 }}>{new Date(project.timeline.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            )}
            {project.timeline.startDate && project.timeline.endDate && (
              <div style={{ color: "rgba(255,255,255,0.3)" }}>→</div>
            )}
            {project.timeline.endDate && (
              <div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>End Date</div>
                <div style={{ fontWeight: 600 }}>{new Date(project.timeline.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
