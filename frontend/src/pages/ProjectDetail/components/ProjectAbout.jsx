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

      {/* Section 3.5: Links & Deliverables */}
      {(project.status === 'in-progress' || project.status === 'completed') && (project.githubIntegration?.isConnected || 
        project.archiveData?.deliverables?.sourceCodeUrl || 
        project.archiveData?.deliverables?.demoVideoUrl || 
        project.archiveData?.deliverables?.reportUrl || 
        project.archiveData?.deliverables?.slidesUrl) && (
        <div className="project-detail__section">
          <h2 className="project-detail__section-title">Links & Deliverables</h2>
          <div className="project-detail__card" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {project.githubIntegration?.isConnected && project.githubIntegration?.repoName && (
              <a href={`https://github.com/${project.githubIntegration.repoName}`} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px' }}>
                GitHub Repository
              </a>
            )}
            {project.archiveData?.deliverables?.sourceCodeUrl && !(project.githubIntegration?.isConnected && project.githubIntegration?.repoName) && (
              <a href={project.archiveData.deliverables.sourceCodeUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px' }}>
                Source Code
              </a>
            )}
            {project.archiveData?.deliverables?.demoVideoUrl && (
              <a href={project.archiveData.deliverables.demoVideoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px' }}>
                Live Demo / Video
              </a>
            )}
            {project.archiveData?.deliverables?.reportUrl && (
              <a href={project.archiveData.deliverables.reportUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--color-text-dark)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                Project Report
              </a>
            )}
            {project.archiveData?.deliverables?.slidesUrl && (
              <a href={project.archiveData.deliverables.slidesUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--color-text-dark)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                Presentation Slides
              </a>
            )}
          </div>
        </div>
      )}

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
