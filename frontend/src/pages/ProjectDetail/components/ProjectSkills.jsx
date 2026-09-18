import { displaySkillLabel } from '../../../utils/display';

export default function ProjectSkills({ project, currentUser }) {
  const userSkills = currentUser?.skills || [];
  const skills = Array.isArray(project?.requiredSkills) ? project.requiredSkills : [];

  return (
    <div className="project-detail__section">
      <h2 className="project-detail__section-title">Required Skills</h2>
      <div className="project-detail__skills-bar">
        {skills.length > 0 ? (
          skills.map((skill, i) => {
            const isMatched = userSkills.some(
              (us) => String(us) === String(skill?._id || skill)
            );
            return (
              <span key={i} className="project-detail__skill-item-wrap">
                <span className="project-detail__skill-text">
                  {displaySkillLabel(skill)}
                </span>
                {i < skills.length - 1 && (
                  <span className="project-detail__skill-slash">/</span>
                )}
              </span>
            );
          })
        ) : (
          <span className="project-detail__empty">No specific skills listed.</span>
        )}
      </div>
    </div>
  );
}
