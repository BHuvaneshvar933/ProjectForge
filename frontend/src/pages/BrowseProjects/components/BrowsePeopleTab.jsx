import { useState } from 'react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import PublicProfileModal from '../../../components/common/PublicProfileModal';
import { displaySkillLabel } from '../../../utils/display';

export default function BrowsePeopleTab({
  ownedProjects,
  selectedProjectId,
  setSelectedProjectId,
  peopleSearch,
  setPeopleSearch,
  searchPeople,
  peopleLoading,
  selectedProject,
  inviteRole,
  setInviteRole,
  inviteMessage,
  setInviteMessage,
  people,
  inviteBusyId,
  sendInvite,
  invitedUserIds = [],
  peoplePagination = { page: 1, pages: 1 },
  loadMorePeople,
  hideControls
}) {
  const [profileUser, setProfileUser] = useState(null);

  return (
    <div className="browse-people">
      {!hideControls && (
        <div className="browse-people__controls-card">
          <div className="browse-people__select-group">
            <label className="browse-people__label">Invite for project</label>
            <select
              className="browse-people__select"
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

          <div className="browse-people__search-group">
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
      )}

      {selectedProject && (
        <div className="browse-people__project-hint">
          <div className="browse-people__label">Project skills required</div>
          <div className="browse-people__skills-single-card">
            {(selectedProject.requiredSkills || []).slice(0, 10).map((s, i) => (
              <span key={s?._id || s?.name || i} className="browse-people__skill-item">
                <span>{displaySkillLabel(s)}</span>
                {i < Math.min((selectedProject.requiredSkills || []).length, 10) - 1 && <span className="browse-people__slash">/</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedProjectId ? (
        <>
          <div className="browse-people__invite-card">
            <Input
              label="Suggested Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              placeholder={selectedProject?.openRoles?.[0] || 'Example: Frontend Developer'}
            />
            <div className="browse-people__field">
              <label className="browse-people__label">Invite note</label>
              <textarea
                className="browse-people__note"
                rows={3}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Tell them what they would work on and why you're inviting them"
              />
            </div>
          </div>

          <div className="browse-people__grid">
            {people.map((u) => (
              <div key={u._id} className="browse-people__card">
                <div className="browse-people__card-header">
                  <div className="browse-people__avatar">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="browse-people__info">
                    <div className="browse-people__name">{u.name}</div>
                    <div className="browse-people__bio">{u.bio || 'No bio provided'}</div>
                  </div>
                  <div className="browse-people__meta">{u.availabilityHoursPerWeek ?? 0} hrs/wk</div>
                </div>

                {Array.isArray(u.skills) && u.skills.length > 0 && (
                  <div className="browse-people__skills-single-card">
                    {u.skills.slice(0, 8).map((s, i) => (
                      <span key={s?._id || s?.name || i} className="browse-people__skill-item">
                        <span>{displaySkillLabel(s)}</span>
                        {i < Math.min(u.skills.length, 8) - 1 && <span className="browse-people__slash">/</span>}
                      </span>
                    ))}
                  </div>
                )}

                <div className="browse-people__actions">
                  <Button variant="outline" onClick={() => setProfileUser(u)}>
                    View Profile
                  </Button>
                  {invitedUserIds.includes(u._id) ? (
                    <Button variant="secondary" disabled>
                      Invited
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      loading={inviteBusyId === u._id}
                      onClick={() => sendInvite(u._id)}
                      disabled={!selectedProjectId}
                    >
                      Invite
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!peopleLoading && people.length === 0 && (
              <div className="browse-page__empty" style={{ padding: 60, gridColumn: "1 / -1" }}>
                <p className="browse-page__empty-title">No people found</p>
                <p className="browse-page__empty-subtitle">Try a different search query or filter.</p>
              </div>
            )}
          </div>
          {peoplePagination?.page < peoplePagination?.pages && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <Button onClick={loadMorePeople} loading={peopleLoading}>
                Load More Developers
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="browse-page__empty" style={{ padding: 60 }}>
          <p className="browse-page__empty-title">No project selected</p>
          <p className="browse-page__empty-subtitle">Select a recruiting project you own to search and invite team members.</p>
        </div>
      )}

      <PublicProfileModal
        isOpen={Boolean(profileUser)}
        onClose={() => setProfileUser(null)}
        userId={profileUser?._id}
      />
    </div>
  );
}
