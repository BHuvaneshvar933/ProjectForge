import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getJoinedProjects, getMyProjects } from '../../api/projectApi';
import ProjectCard from '../../components/common/ProjectCard';
import { toast } from 'react-toastify';
import './MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('owned'); // owned | joined
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setFilter('all');
  }, [mode]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = mode === 'owned' ? await getMyProjects() : await getJoinedProjects();
      const list = res.data?.data?.projects ?? [];
      setProjects(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filterProjects = (projects) => {
    if (filter === 'all') return projects;
    return projects.filter(p => p.status === filter);
  };

  const renderProjectList = () => {
    const filtered = filterProjects(projects);
    
    if (filtered.length === 0) {
      return (
        <div className="my-projects__empty">
          <div className="my-projects__empty-icon">
            <svg className="my-projects__empty-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="my-projects__empty-title">
            {mode === 'owned' ? 'No owned projects yet' : 'No joined projects yet'}
          </p>
          <p className="my-projects__empty-subtitle">
            {mode === 'owned'
              ? 'Create your first project to get started'
              : 'Browse projects and apply to join a team'}
          </p>
          {mode === 'owned' ? (
            <Link to="/projects/create">
              <button className="my-projects__empty-action">Create Project</button>
            </Link>
          ) : (
            <Link to="/projects">
              <button className="my-projects__empty-action">Browse Projects</button>
            </Link>
          )}
        </div>
      );
    }

    return (
        <div className="my-projects__grid">
          {filtered.map(project => (
            <ProjectCard 
              key={project._id} 
              project={project} 
              type={mode}
            />
          ))}
        </div>
      );
  };

  if (loading) {
    return (
      <div className="my-projects__loading">
        <div className="my-projects__loading-spinner" />
        <p className="my-projects__loading-text">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="my-projects">
      <div className="my-projects__header">
        <div>
          <h1 className="my-projects__title">My Projects</h1>
          <p className="my-projects__subtitle">
            {mode === 'owned' ? 'Projects you created' : 'Projects you joined'}
          </p>
        </div>
        {mode === 'owned' && (
          <Link to="/projects/create">
            <button className="my-projects__new-button">
              <svg className="my-projects__new-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </Link>
        )}
      </div>

      <div className="my-projects__mode">
        <button
          onClick={() => setMode('owned')}
          className={`my-projects__filter-btn ${mode === 'owned' ? 'is-active' : ''}`.trim()}
        >
          Owned
        </button>
        <button
          onClick={() => setMode('joined')}
          className={`my-projects__filter-btn ${mode === 'joined' ? 'is-active' : ''}`.trim()}
        >
          Joined
        </button>
      </div>

      <div className="my-projects__filters">
        {['all', 'recruiting', 'in-progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`my-projects__filter-btn ${filter === status ? 'is-active' : ''}`.trim()}
          >
            {status === 'in-progress' ? 'Active' : status}
          </button>
        ))}
      </div>

      <div className="my-projects__content">
        {renderProjectList()}
      </div>
    </div>
  );
}
