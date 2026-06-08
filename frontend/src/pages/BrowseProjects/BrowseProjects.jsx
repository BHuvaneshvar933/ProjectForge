import { useMemo, useState, useEffect, useCallback } from 'react';
import { browseProjects, getMyProjects } from '../../api/projectApi';
import { getProjectRecommendations } from '../../api/recommendationApi';
import { searchUsers } from '../../api/userApi';
import { inviteUserToProject } from '../../api/applicationApi';
import Input from '../../components/common/Input';
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
        <BrowsePeopleTab
          ownedProjects={ownedProjects}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          peopleSearch={peopleSearch}
          setPeopleSearch={setPeopleSearch}
          searchPeople={searchPeople}
          peopleLoading={peopleLoading}
          selectedProject={selectedProject}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          inviteMessage={inviteMessage}
          setInviteMessage={setInviteMessage}
          people={people}
          inviteBusyId={inviteBusyId}
          sendInvite={sendInvite}
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
        />
      )}
    </div>
  );
}
