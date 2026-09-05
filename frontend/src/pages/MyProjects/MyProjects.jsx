import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getJoinedProjects, getMyProjects } from '../../api/projectApi';
import ProjectCard from '../../components/common/ProjectCard';
import DashboardPagination from '../../components/common/DashboardPagination';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';
import './MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('owned'); // owned | joined
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setFilter('all');
    setPage(1);
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
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const currentList = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    
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
      <div className="my-projects__content-wrapper">
        <div className="my-projects__grid">
          {currentList.map(project => (
            <ProjectCard 
              key={project._id} 
              project={project} 
              type={mode}
            />
          ))}
        </div>
        
        {totalPages >= 1 && (
          <DashboardPagination 
            page={page} 
            totalPages={totalPages} 
            setPage={setPage} 
          />
        )}
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
    <div className="dashboard-page">
      <PageHeader
        title="My Projects"
        actions={
          mode === 'owned' && (
            <Link to="/projects/create">
              <button className="dashboard-header__btn">
                <svg style={{width: 16, height: 16}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </Link>
          )
        }
      />

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar__section">
            <h3 className="dashboard-sidebar__heading">Project Type</h3>
            <div className="dashboard-sidebar__tabs">
              <button
                onClick={() => setMode('owned')}
                className={`dashboard-sidebar__tab ${mode === 'owned' ? 'is-active' : ''}`.trim()}
              >
                Owned Projects
              </button>
              <button
                onClick={() => setMode('joined')}
                className={`dashboard-sidebar__tab ${mode === 'joined' ? 'is-active' : ''}`.trim()}
              >
                Joined Projects
              </button>
            </div>
          </div>

          <div className="dashboard-sidebar__section">
            <h3 className="dashboard-sidebar__heading">Status</h3>
            <div className="dashboard-sidebar__tabs">
              {['all', 'recruiting', 'in-progress', 'completed']
                .map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(1);
                  }}
                  className={`dashboard-sidebar__tab ${filter === status ? 'is-active' : ''}`.trim()}
                >
                  {status === 'in-progress' ? 'In-Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="dashboard-content">
          <div className="my-projects__content">
            {renderProjectList()}
          </div>
        </main>
      </div>
    </div>
  );
}
