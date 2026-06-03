import { useMemo, useState, useEffect, useCallback } from 'react';
import { browseProjects, getMyProjects } from '../../api/projectApi';
import { getProjectRecommendations } from '../../api/recommendationApi';
import ProjectCard from '../../components/common/ProjectCard';
import ProjectCardSkeleton from '../../components/common/ProjectCardSkeleton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import Badge from '../../components/common/Badge';
import { searchUsers } from '../../api/userApi';
import { inviteUserToProject } from '../../api/applicationApi';
import { displaySkillLabel } from '../../utils/display';
import './BrowseProjects.css';

export default function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
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

  const [tab, setTab] = useState('projects'); // projects | people

  // People search + invite
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteBusyId, setInviteBusyId] = useState('');

  const tokenPresent = (() => {
    try {
      return Boolean(
        window?.localStorage?.getItem('token') ||
          window?.localStorage?.getItem('pf_token') ||
          window?.localStorage?.getItem('projectforge_token')
      );
    } catch {
      return false;
    }
  })();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, search: search || undefined };
      const { data } = await browseProjects(params);
      const payload = data?.data ?? {};
      setProjects(payload.projects ?? []);
      setPagination(payload.pagination ?? { page: 1, total: 0, pages: 1 });

      if (tokenPresent && filters.page === 1 && !search && !filters.status && !filters.projectType) {
        try {
          const recRes = await getProjectRecommendations({ limit: 5 });
          const recs = recRes.data?.data?.recommendations ?? [];
          setRecommendations(Array.isArray(recs) ? recs : []);
        } catch {
          setRecommendations([]);
        }
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
      setPagination({ page: 1, total: 0, pages: 1 });
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [filters, search, tokenPresent]);

  const selectedProject = useMemo(() => {
    return ownedProjects.find((p) => String(p?._id) === String(selectedProjectId)) || null;
  }, [ownedProjects, selectedProjectId]);

  const canUsePeople = tokenPresent;

  const fetchOwnedProjects = useCallback(async () => {
    if (!canUsePeople) return;
    try {
      const res = await getMyProjects();
      const list = res?.data?.data?.projects ?? [];
      const recruiting = Array.isArray(list)
        ? list.filter((p) => p?.status === 'recruiting' && p?.isDeleted !== true)
        : [];
      setOwnedProjects(recruiting);
      if ((!selectedProjectId || !recruiting.some((p) => String(p?._id) === String(selectedProjectId))) && recruiting[0]?._id) {
        setSelectedProjectId(recruiting[0]._id);
      }
    } catch {
      setOwnedProjects([]);
    }
  }, [canUsePeople, selectedProjectId]);

  const searchPeople = useCallback(async () => {
    if (!canUsePeople) return;
    setPeopleLoading(true);
    try {
      const skillIds = Array.isArray(selectedProject?.requiredSkills)
        ? selectedProject.requiredSkills.map((s) => s?._id || s).filter(Boolean).join(',')
        : '';

      const res = await searchUsers({ search: peopleSearch, skills: skillIds, limit: 12 });
      const users = res?.data?.data?.users ?? [];
      setPeople(Array.isArray(users) ? users : []);
    } catch {
      setPeople([]);
    } finally {
      setPeopleLoading(false);
    }
  }, [canUsePeople, peopleSearch, selectedProject]);

  const sendInvite = async (userId) => {
    if (!selectedProjectId) return;
    if (!userId) return;
    setInviteBusyId(userId);
    try {
      await inviteUserToProject({
        projectId: selectedProjectId,
        userId,
        invitedRole: inviteRole || undefined,
        message: inviteMessage || undefined,
      });
      toast.success('Invitation sent');
      setInviteMessage('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviteBusyId('');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (tab !== 'people') return;
    fetchOwnedProjects();
  }, [fetchOwnedProjects, tab]);

  useEffect(() => {
    if (tab !== 'people') return;
    // refresh people search when project changes
    searchPeople();
  }, [searchPeople, selectedProjectId, tab]);

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

      <div className="browse-page__tabs">
        <button
          type="button"
          className={`browse-page__tab ${tab === 'projects' ? 'is-active' : ''}`.trim()}
          onClick={() => setTab('projects')}
        >
          Projects
        </button>
        <button
          type="button"
          className={`browse-page__tab ${tab === 'people' ? 'is-active' : ''}`.trim()}
          onClick={() => setTab('people')}
          disabled={!tokenPresent}
          title={!tokenPresent ? 'Login required' : ''}
        >
          People
        </button>
      </div>

      {tab === 'people' ? (
        <div className="browse-people">
          <div className="browse-people__controls">
            <div className="browse-people__select">
              <div className="browse-people__label">Invite for project</div>
              <select
                className="browse-page__select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {ownedProjects.length === 0 ? (
                  <option value="">No recruiting projects</option>
                ) : (
                  ownedProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="browse-people__search">
              <Input
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder="Search people by name or bio..."
              />
              <Button variant="primary" onClick={searchPeople} loading={peopleLoading}>
                Search
              </Button>
            </div>
          </div>

          {selectedProject && (
            <div className="browse-people__project-hint">
              <div className="browse-people__label">Project skills</div>
              <div className="browse-people__skills">
                {(selectedProject.requiredSkills || []).slice(0, 10).map((s) => (
                  <Badge key={s?._id || s?.name || s} variant="skill">
                    {displaySkillLabel(s)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="browse-people__invite">
            <Input
              label="Suggested Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              placeholder={selectedProject?.openRoles?.[0] || 'Example: Frontend Developer'}
            />
            <div className="browse-people__label">Invite note</div>
            <textarea
              className="browse-people__note"
              rows={3}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Tell them what they would work on and why you're inviting them"
            />
          </div>

          <div className="browse-people__grid">
            {people.map((u) => (
              <div key={u._id} className="browse-people__card">
                <div className="browse-people__card-top">
                  <div>
                    <div className="browse-people__name">{u.name}</div>
                    <div className="browse-people__bio">{u.bio || 'No bio'}</div>
                  </div>
                  <div className="browse-people__meta">{u.availabilityHoursPerWeek ?? 0} hrs/week</div>
                </div>

                {Array.isArray(u.skills) && u.skills.length > 0 && (
                  <div className="browse-people__skills">
                    {u.skills.slice(0, 8).map((s) => (
                      <Badge key={s?._id || s?.name} variant="skill">{displaySkillLabel(s)}</Badge>
                    ))}
                  </div>
                )}

                <div className="browse-people__actions">
                  <Button
                    variant="primary"
                    loading={inviteBusyId === u._id}
                    onClick={() => sendInvite(u._id)}
                    disabled={!selectedProjectId}
                  >
                    Invite
                  </Button>
                </div>
              </div>
            ))}
            {!peopleLoading && people.length === 0 && (
              <div className="browse-page__empty" style={{ padding: 60 }}>
                <p className="browse-page__empty-title">No people found</p>
                <p className="browse-page__empty-subtitle">Try a different search.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
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

          {/* Projects Grid */}
          {loading ? (
            <div className="browse-page__grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {tokenPresent && recommendations.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h2 className="browse-page__title" style={{ fontSize: 18, marginBottom: 10 }}>
                    Recommended For You
                  </h2>
                  <div className="browse-page__grid">
                    {recommendations.map((project) => (
                      <ProjectCard key={project._id} project={project} type="browse" />
                    ))}
                  </div>
                </div>
              )}

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
                    {projects.map((project) => (
                      <ProjectCard key={project._id} project={project} type="browse" />
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
        </>
      )}
    </div>
  );
}
