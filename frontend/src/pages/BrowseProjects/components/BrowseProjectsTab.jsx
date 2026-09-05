import ProjectCard from '../../../components/common/ProjectCard';
import ProjectCardSkeleton from '../../../components/common/ProjectCardSkeleton';
import DashboardPagination from '../../../components/common/DashboardPagination';

export default function BrowseProjectsTab({
  filters,
  setFilters,
  loading,
  tokenPresent,
  recommendations,
  projects,
  pagination,
  hideControls
}) {
  const validRecommendations = recommendations.filter(r => typeof r.matchScore === 'number' && Math.round(r.matchScore) > 0);
  const recommendedIds = new Set(validRecommendations.map(r => r._id));
  const otherProjects = projects.filter(p => !recommendedIds.has(p._id));

  return (
    <>
      {!hideControls && (
        <div className="browse-page__filters">
          <select
            value={filters.projectType}
            onChange={(e) => setFilters({ ...filters, projectType: e.target.value, page: 1 })}
            className="browse-page__select"
          >
            <option value="">All Types</option>
            <option value="web">Web</option>
            <option value="mobile">Mobile</option>
            <option value="ml">ML</option>
            <option value="hackathon">Hackathon</option>
          </select>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="browse-page__grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {tokenPresent && validRecommendations.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <h2 className="browse-page__section-title">
                Recommended For You
              </h2>
              <div className="browse-page__grid">
                {validRecommendations.map((project) => (
                  <ProjectCard key={project._id} project={project} type="browse" />
                ))}
              </div>
            </div>
          )}

          {otherProjects.length === 0 && validRecommendations.length === 0 ? (
            <div className="browse-page__empty">
              <p className="browse-page__empty-title">No projects found</p>
              <p className="browse-page__empty-subtitle">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {otherProjects.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <h2 className="browse-page__section-title">
                    {validRecommendations.length > 0 ? 'Other Projects' : 'Explore Projects'}
                  </h2>
                  <div className="browse-page__grid">
                    {otherProjects.map((project) => (
                      <ProjectCard key={project._id} project={project} type="browse" />
                    ))}
                  </div>
                </div>
              )}

              <DashboardPagination 
                page={filters.page} 
                totalPages={pagination.pages || 1} 
                setPage={(page) => setFilters({ ...filters, page })} 
              />
            </>
          )}
        </>
      )}
    </>
  );
}
