import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById, getProjectTeam } from '../../api/projectApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { toast } from 'react-toastify';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data } = await getProjectById(id);
      setProject(data);
      
      // Fetch team members
      const teamRes = await getProjectTeam(id);
      setTeam(teamRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-detail__loading">
        <Spinner size="lg" />
        <p className="project-detail__loading-text">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail__error">
        <div className="project-detail__error-icon">
          <svg className="project-detail__error-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="project-detail__error-title">Something went wrong</h2>
        <p className="project-detail__error-text">{error || 'Project not found'}</p>
        <Link to="/projects">
          <Button>Browse Projects</Button>
        </Link>
      </div>
    );
  }

  const isRecruiting = project.status === 'recruiting';
  const teamFull = project.currentTeamSize >= project.teamSizeRequired;
  const openRoles = project.openRoles || [];
  const descriptionExpanded = expanded || project.description?.length < 300;

  // Calculate duration
  const startDate = project.timeline?.startDate ? new Date(project.timeline.startDate) : null;
  const endDate = project.timeline?.endDate ? new Date(project.timeline.endDate) : null;
  const duration = startDate && endDate 
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) 
    : null;

  return (
    <div className="project-detail">
      <div className="project-detail__header">
        <div>
          <h1 className="project-detail__title">{project.title}</h1>
          <div className="project-detail__badges">
            <Badge variant={project.projectType}>{project.projectType}</Badge>
            <Badge variant={project.status}>{project.status}</Badge>
            <Badge variant="default">
              Team: {project.currentTeamSize} / {project.teamSizeRequired}
            </Badge>
          </div>
        </div>
        
        <div className="project-detail__actions">
          {isRecruiting && !teamFull && (
            <Button variant="primary" disabled>Apply (Auth needed)</Button>
          )}

          {!isRecruiting && (
            <Button variant="secondary" disabled>Not recruiting</Button>
          )}

          {teamFull && isRecruiting && (
            <Button disabled variant="secondary">Team Full</Button>
          )}

          <Link to={`/projects/${id}/edit`}>
            <Button variant="secondary">Edit Project</Button>
          </Link>
        </div>
      </div>

      {/* Section 2: Owner Info */}
      <div className="project-detail__section">
        <h2 className="project-detail__section-title">Project Owner</h2>
        <div className="project-detail__card project-detail__owner">
          <div className="project-detail__owner-avatar">
            <span className="project-detail__owner-initial">{project.owner?.name?.[0] || 'U'}</span>
          </div>
          <div>
            <div className="project-detail__owner-name">{project.owner?.name || 'Unknown'}</div>
            <div className="project-detail__owner-bio">{project.owner?.bio || 'No bio'}</div>
          </div>
        </div>
      </div>

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
              <Badge key={i} variant="skill">{skill.name || skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Timeline */}
      {(startDate || endDate) && (
        <div className="project-detail__section">
          <h2 className="project-detail__section-title">Timeline</h2>
          <div className="project-detail__card">
            <div className="project-detail__timeline-grid">
              {startDate && (
                <div className="project-detail__timeline-item">
                  <div className="project-detail__timeline-label">Start Date</div>
                  <div className="project-detail__timeline-value">{startDate.toLocaleDateString()}</div>
                </div>
              )}
              {endDate && (
                <div className="project-detail__timeline-item">
                  <div className="project-detail__timeline-label">End Date</div>
                  <div className="project-detail__timeline-value">{endDate.toLocaleDateString()}</div>
                </div>
              )}
              {duration && (
                <div className="project-detail__timeline-item">
                  <div className="project-detail__timeline-label">Duration</div>
                  <div className="project-detail__timeline-value">{duration} days</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Team Section */}
      <div className="project-detail__section">
        <h2 className="project-detail__section-title">
          Team <span className="project-detail__section-count">({team.length} / {project.teamSizeRequired})</span>
        </h2>
        <div className="project-detail__team-grid">
          {team.map((member) => (
            <div key={member._id} className="project-detail__card project-detail__team-card">
              <div className="project-detail__team-row">
                <div className="project-detail__team-info">
                  <div className="project-detail__team-avatar">
                    <span className="project-detail__team-initial">{member.userId?.name?.[0] || 'U'}</span>
                  </div>
                  <div>
                    <div className="project-detail__team-name">{member.userId?.name}</div>
                    <div className="project-detail__team-role">{member.projectRole}</div>
                  </div>
                </div>
                <Badge variant={member.role}>{member.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: Open Roles */}
      {openRoles.length > 0 && (
        <div className="project-detail__section">
          <h2 className="project-detail__section-title">Open Roles</h2>
          <div className="project-detail__roles">
            {openRoles.map((role, i) => (
              <Badge key={i} variant="skill">{role}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}