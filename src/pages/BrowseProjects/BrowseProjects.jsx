import { useState, useEffect } from 'react';
import { browseProjects } from '../../api/projectApi';
import ProjectCard from '../../components/common/ProjectCard';
import Input from '../../components/common/Input';
import './BrowseProjects.css';

export default function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    projectType: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = { ...filters, search: search || undefined };
      const { data } = await browseProjects(params);
      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div className="browse-page">
      <div className="browse-page__header">
        <div>
          <h1 className="browse-page__title">Browse Projects</h1>
          <p className="browse-page__subtitle">Discover and join exciting projects</p>
        </div>
        
        <form onSubmit={handleSearch} className="browse-page__search">
          <div className="browse-page__search-field">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="browse-page__search-input"
            />
            <svg 
              className="browse-page__search-icon"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button type="submit" className="browse-page__search-button">
            Search
          </button>
        </form>
      </div>

      <div className="browse-page__filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="browse-page__select"
        >
          <option value="">All Status</option>
          <option value="recruiting">Recruiting</option>
          <option value="in-progress">In Progress</option>
        </select>
        
        <select
          value={filters.projectType}
          onChange={(e) => setFilters({ ...filters, projectType: e.target.value, page: 1 })}
          className="browse-page__select"
        >
          <option value="">All Types</option>
          <option value="personal">Personal</option>
          <option value="startup">Startup</option>
          <option value="open-source">Open Source</option>
          <option value="academic">Academic</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="browse-page__loading">
          <div className="browse-page__loading-spinner" />
          <p className="browse-page__loading-text">Loading projects...</p>
        </div>
      ) : (
        <>
          {projects.length === 0 ? (
            <div className="browse-page__empty">
              <div className="browse-page__empty-icon">
                <svg className="browse-page__empty-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="browse-page__empty-title">No projects found</p>
              <p className="browse-page__empty-subtitle">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="browse-page__grid">
                {projects.map(project => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>

              {/* Pagination - Apple style */}
              {pagination.pages > 1 && (
                <div className="browse-page__pagination">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className={`browse-page__nav-btn ${filters.page === 1 ? 'is-disabled' : ''}`.trim()}
                  >
                    <svg className="browse-page__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="browse-page__nav-text">Prev</span>
                  </button>
                  
                  <div className="browse-page__pages">
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setFilters({ ...filters, page: pageNum })}
                          className={`browse-page__page-btn ${filters.page === pageNum ? 'is-active' : ''}`.trim()}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className={`browse-page__nav-btn ${filters.page === pagination.pages ? 'is-disabled' : ''}`.trim()}
                  >
                    <span className="browse-page__nav-text">Next</span>
                    <svg className="browse-page__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}