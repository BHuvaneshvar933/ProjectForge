import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { browseProjects } from '../../api/projectApi';
import ProjectCard from '../../components/common/ProjectCard';
import { toast } from 'react-toastify';
import './MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await browseProjects({ limit: 30 });
      setProjects(data.projects || []);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="my-projects__empty-title">No projects yet</p>
          <p className="my-projects__empty-subtitle">Create your first project to get started</p>
          <Link to="/projects/create">
            <button className="my-projects__empty-action">Create Project</button>
          </Link>
        </div>
      );
    }

    return (
      <div className="my-projects__grid">
        {filtered.map(project => (
          <ProjectCard 
            key={project._id} 
            project={project} 
            type="joined"
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
          <p className="my-projects__subtitle">Browse and manage available projects</p>
        </div>
        <Link to="/projects/create">
          <button className="my-projects__new-button">
            <svg className="my-projects__new-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </Link>
      </div>

      <div className="my-projects__filters">
        {['all', 'recruiting', 'in-progress', 'archived'].map((status) => (
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