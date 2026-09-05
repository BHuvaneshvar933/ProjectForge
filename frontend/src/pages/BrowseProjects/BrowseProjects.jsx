import { useMemo, useState, useEffect, useCallback } from 'react';
import { browseProjects, getMyProjects } from '../../api/projectApi';
import { getProjectRecommendations } from '../../api/recommendationApi';
import { searchUsers } from '../../api/userApi';
import { inviteUserToProject } from '../../api/applicationApi';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

import BrowsePeopleTab from './components/BrowsePeopleTab';
import BrowseProjectsTab from './components/BrowseProjectsTab';

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
  const [peoplePage, setPeoplePage] = useState(1);
  const [peoplePagination, setPeoplePagination] = useState({ page: 1, total: 0, pages: 1 });
  const [invitedUserIds, setInvitedUserIds] = useState([]);
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

  const searchPeople = useCallback(async (page = 1) => {
    if (!canUsePeople) return;
    setPeopleLoading(true);
    try {
      const skillIds = Array.isArray(selectedProject?.requiredSkills)
        ? selectedProject.requiredSkills.map((s) => s?._id || s).filter(Boolean).join(',')
        : '';

      const res = await searchUsers({ 
        search: peopleSearch, 
        skills: skillIds, 
        limit: 12, 
        page, 
        projectId: selectedProjectId 
      });
      
      const payload = res?.data?.data ?? {};
      const fetchedUsers = Array.isArray(payload.users) ? payload.users : [];
      const newPagination = payload.pagination ?? { page: 1, total: 0, pages: 1 };
      
      if (page === 1) {
        setPeople(fetchedUsers);
      } else {
        setPeople(prev => [...prev, ...fetchedUsers]);
      }
      setPeoplePagination(newPagination);
      setPeoplePage(page);
    } catch {
      if (page === 1) setPeople([]);
    } finally {
      setPeopleLoading(false);
    }
  }, [canUsePeople, peopleSearch, selectedProject, selectedProjectId]);

  const loadMorePeople = () => {
    if (peoplePagination.page < peoplePagination.pages && !peopleLoading) {
      searchPeople(peoplePage + 1);
    }
  };

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
      setInvitedUserIds(prev => [...prev, userId]);
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
    searchPeople(1);
  }, [searchPeople, selectedProjectId, tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div className="browse-page">
      <PageHeader
        title={tab === 'projects' ? 'Project Catalog & Index' : 'Talent & Developer Directory'}
      />

      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar__section">
            <div className="dashboard-sidebar__tabs">
              <button
                type="button"
                className={`dashboard-sidebar__tab ${tab === 'projects' ? 'is-active' : ''}`.trim()}
                onClick={() => setTab('projects')}
              >
                Projects
              </button>
              <button
                type="button"
                className={`dashboard-sidebar__tab ${tab === 'people' ? 'is-active' : ''}`.trim()}
                onClick={() => setTab('people')}
                disabled={!tokenPresent}
                title={!tokenPresent ? 'Login required' : ''}
              >
                People
              </button>
            </div>
          </div>

          {tab === 'projects' && (
            <>
              <div className="dashboard-sidebar__section">
                <h3 className="dashboard-sidebar__heading">Search</h3>
                <form onSubmit={handleSearch} className="browse-page__search" style={{ flexDirection: 'column' }}>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects..."
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <button type="submit" className="dashboard-sidebar__btn">
                    Search
                  </button>
                </form>
              </div>

              <div className="dashboard-sidebar__section">
                <h3 className="dashboard-sidebar__heading">Filter By Type</h3>
                <select
                  value={filters.projectType}
                  onChange={(e) => setFilters({ ...filters, projectType: e.target.value, page: 1 })}
                  className="dashboard-sidebar__select"
                >
                  <option value="">All Types</option>
                  <option value="web">Web</option>
                  <option value="mobile">Mobile</option>
                  <option value="ml">ML</option>
                  <option value="hackathon">Hackathon</option>
                </select>
              </div>
            </>
          )}

          {tab === 'people' && (
            <>
              <div className="dashboard-sidebar__section">
                <h3 className="dashboard-sidebar__heading">Search People</h3>
                <form onSubmit={(e) => { e.preventDefault(); searchPeople(1); }} className="browse-page__search" style={{ flexDirection: 'column' }}>
                  <Input
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    placeholder="Search skills, bio..."
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <button type="submit" className="dashboard-sidebar__btn">
                    Search
                  </button>
                </form>
              </div>

              <div className="dashboard-sidebar__section">
                <h3 className="dashboard-sidebar__heading">Invite to Project</h3>
                {ownedProjects.length === 0 ? (
                  <div className="dashboard-sidebar__note">
                    You need an active recruiting project to invite users.
                  </div>
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="dashboard-sidebar__select"
                  >
                    <option value="" disabled>Select a project...</option>
                    {ownedProjects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-content">
          {tab === 'people' ? (
            <BrowsePeopleTab
              ownedProjects={ownedProjects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              peopleSearch={peopleSearch}
              setPeopleSearch={setPeopleSearch}
              searchPeople={() => searchPeople(1)}
              peopleLoading={peopleLoading}
              selectedProject={selectedProject}
              inviteRole={inviteRole}
              setInviteRole={setInviteRole}
              inviteMessage={inviteMessage}
              setInviteMessage={setInviteMessage}
              people={people}
              inviteBusyId={inviteBusyId}
              sendInvite={sendInvite}
              invitedUserIds={invitedUserIds}
              peoplePagination={peoplePagination}
              loadMorePeople={loadMorePeople}
              hideControls={true}
            />
          ) : (
            <BrowseProjectsTab
              filters={filters}
              setFilters={setFilters}
              loading={loading}
              tokenPresent={tokenPresent}
              recommendations={recommendations}
              projects={projects}
              pagination={pagination}
              hideControls={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}
