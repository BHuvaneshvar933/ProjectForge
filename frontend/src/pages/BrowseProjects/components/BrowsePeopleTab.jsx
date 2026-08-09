import { useState } from 'react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
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
      )}

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

      {selectedProjectId ? (
        <>
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

                <div className="browse-people__actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
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
                <p className="browse-page__empty-subtitle">Try a different search.</p>
              </div>
            )}
          </div>
          {peoplePagination?.page < peoplePagination?.pages && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Button onClick={loadMorePeople} loading={peopleLoading}>
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="browse-page__empty" style={{ padding: 60 }}>
          <div className="browse-page__empty-icon">
            <svg className="browse-page__empty-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="browse-page__empty-title">No project selected</p>
          <p className="browse-page__empty-subtitle">Select a recruiting project you own to search and invite people.</p>
        </div>
      )}

      <Modal
        isOpen={Boolean(profileUser)}
        onClose={() => setProfileUser(null)}
        title={profileUser?.name ? `${profileUser.name}'s Profile` : "Applicant Profile"}
      >
        {profileUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--color-zinc-400)', fontSize: '14px', lineHeight: '1.5' }}>
              {profileUser.bio || "No bio provided."}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Email:</strong> {profileUser.email || "-"}</div>
              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Availability:</strong> {profileUser.availabilityHoursPerWeek ?? 0} hrs/week</div>
              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Projects Active:</strong> {profileUser?.stats?.projectsActive ?? 0}</div>
              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Projects Completed:</strong> {profileUser?.stats?.projectsCompleted ?? 0}</div>
              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Tasks Completed:</strong> {profileUser?.stats?.tasksCompleted ?? 0}</div>

              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Acceptance Rate:</strong> {profileUser?.stats?.acceptanceRate ? `${(profileUser.stats.acceptanceRate * 100).toFixed(0)}%` : "0%"}</div>
              <div><strong style={{ color: 'var(--color-zinc-200)' }}>Member Since:</strong> {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : "-"}</div>
            </div>

            {profileUser?.portfolioLinks && (Object.values(profileUser.portfolioLinks).some(link => link)) && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                {profileUser.portfolioLinks.github && (
                  <a href={profileUser.portfolioLinks.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-zinc-300)', textDecoration: 'underline' }}>GitHub</a>
                )}
                {profileUser.portfolioLinks.linkedin && (
                  <a href={profileUser.portfolioLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-zinc-300)', textDecoration: 'underline' }}>LinkedIn</a>
                )}
                {profileUser.portfolioLinks.website && (
                  <a href={profileUser.portfolioLinks.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-zinc-300)', textDecoration: 'underline' }}>Website</a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
