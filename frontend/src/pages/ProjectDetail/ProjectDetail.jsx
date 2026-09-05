import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJoinedProjects, getProjectById } from '../../api/projectApi';
import { getCurrentUser } from '../../api/authApi';
import { applyToProject, getMyApplications } from '../../api/applicationApi';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

import ProjectHeader from './components/ProjectHeader';
import ProjectAbout from './components/ProjectAbout';
import ProjectTimeline from './components/ProjectTimeline';
import ProjectTeam from './components/ProjectTeam';
import EducationalTip from '../../components/common/EducationalTip';

import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [myApplication, setMyApplication] = useState(null);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getProjectById(id);
      const p = data?.data?.project ?? null;
      setProject(p);
      setTeam(Array.isArray(p?.team) ? p.team : []);

      const token =
        (typeof window !== 'undefined' &&
          (window.localStorage.getItem('token') ||
            window.localStorage.getItem('pf_token') ||
            window.localStorage.getItem('projectforge_token'))) ||
        '';

      if (token) {
        try {
          const [meRes, joinedRes, appsRes] = await Promise.all([
            getCurrentUser(),
            getJoinedProjects(),
            getMyApplications({ page: 1, limit: 50 }),
          ]);

          const me = meRes.data?.data?.user ?? null;
          setCurrentUser(me);

          const joined = joinedRes.data?.data?.projects ?? [];
          const member = Array.isArray(joined)
            ? joined.some((p) => String(p?._id) === String(id))
            : false;
          setIsMember(member || (me?._id && p?.owner?._id && String(me._id) === String(p.owner._id)));

          const apps = appsRes.data?.data?.applications ?? [];
          const app = Array.isArray(apps)
            ? apps.find((a) => String(a?.projectId?._id) === String(id))
            : null;
          setMyApplication(app || null);
        } catch {
          setCurrentUser(null);
          setIsMember(false);
          setMyApplication(null);
        }
      } else {
        setCurrentUser(null);
        setIsMember(false);
        setMyApplication(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

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
        <Button onClick={() => navigate('/projects')}>Browse Projects</Button>
      </div>
    );
  }

  const isRecruiting = project.status === 'recruiting';
  const teamFull = project.currentTeamSize >= project.teamSizeRequired;
  const openRoles = Array.isArray(project.openRoles)
    ? project.openRoles.filter((r) => typeof r === 'string' && r.trim().length > 0)
    : [];

  const tokenPresent =
    (typeof window !== 'undefined' &&
      (window.localStorage.getItem('token') ||
        window.localStorage.getItem('pf_token') ||
        window.localStorage.getItem('projectforge_token'))) ||
    '';

  const fallbackUserId =
    (typeof window !== 'undefined' &&
      (window.localStorage.getItem('userId') ||
        window.localStorage.getItem('pf_user_id') ||
        window.localStorage.getItem('projectforge_user_id'))) ||
    '';

  const isOwner = Boolean(
    (currentUser?._id && project.owner?._id && String(currentUser._id) === String(project.owner._id)) ||
    (fallbackUserId && project.owner?._id && String(fallbackUserId) === String(project.owner._id))
  );

  const applicationStatus = myApplication?.status;

  const canApply =
    Boolean(tokenPresent) &&
    !isOwner &&
    !isMember &&
    !teamFull &&
    isRecruiting &&
    (!applicationStatus || applicationStatus === 'withdrawn' || applicationStatus === 'rejected');

  const showPending = Boolean(applicationStatus === 'pending');

  const skillMatchScore = (() => {
    const userSkills = Array.isArray(currentUser?.skills) ? currentUser.skills : [];
    const projectSkills = Array.isArray(project.requiredSkills) ? project.requiredSkills : [];

    const userIds = new Set(userSkills.map((s) => String(s)));
    const projIds = new Set(projectSkills.map((s) => String(s?._id ?? s)));

    const denominator = Math.min(userIds.size, projIds.size);
    if (denominator === 0) return null;

    let intersectionCount = 0;
    for (const id of userIds) {
      if (projIds.has(id)) intersectionCount += 1;
    }

    return Math.round((intersectionCount / denominator) * 100);
  })();

  const handleApply = async () => {
    if (!canApply) return;

    setApplyLoading(true);
    try {
      await applyToProject(id, applyMessage);
      toast.success('Application submitted');
      setShowApplyModal(false);
      setApplyMessage('');
      await fetchProject();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to apply');
    } finally {
      setApplyLoading(false);
    }
  };


  return (
    <div className="project-detail">
      <div className="project-detail__card-container">
        <ProjectHeader
          project={project}
          tokenPresent={tokenPresent}
          isMember={isMember}
          showPending={showPending}
          teamFull={teamFull}
          isRecruiting={isRecruiting}
          canApply={canApply}
          applyLoading={applyLoading}
          setShowApplyModal={setShowApplyModal}
          isOwner={isOwner}
          goToApplications={() => navigate(`/projects/${id}/applications`)}
        />
        <ProjectAbout
          project={project}
          tokenPresent={tokenPresent}
          skillMatchScore={skillMatchScore}
          currentUser={currentUser}
        />

        <ProjectTimeline project={project} />

        <ProjectTeam project={project} team={team} openRoles={openRoles} />
      </div>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply to Join"
        onConfirm={handleApply}
        confirmText={applyLoading ? 'Submitting...' : 'Submit Application'}
      >
        <EducationalTip content="Project owners review this note carefully. Mention exactly which open role you want and link a relevant past project if possible." />
        <p className="project-detail__modal-hint">
          Share a short note about why you want to join.
        </p>
        <textarea
          className="project-detail__modal-textarea"
          rows={5}
          value={applyMessage}
          onChange={(e) => setApplyMessage(e.target.value)}
          placeholder="Example: I can take the Frontend role, I have experience with React and shipping Vite apps..."
        />
      </Modal>
    </div>
  );
}
