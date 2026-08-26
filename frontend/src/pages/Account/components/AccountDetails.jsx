import { Link } from "react-router-dom";

export default function AccountDetails({ user }) {

  return (
    <div className="account__card">
      <div className="account__card-title">Account Details</div>

      <div className="account__section">
        <div className="account__muted">Email</div>
        <div style={{ marginTop: 4, fontWeight: 700, color: "var(--color-text-dark)", fontSize: "15px" }}>
          {user.email || "-"}
        </div>
      </div>

      <div className="account__section">
        <div className="account__muted">Member Since</div>
        <div style={{ marginTop: 4, fontWeight: 700, color: "var(--color-text-dark)", fontSize: "15px" }}>
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
        </div>
      </div>

      <div className="account__section">
        <div className="account__card-title" style={{ marginBottom: 16 }}>
          Developer Journey
        </div>
        <div className="account__journey-stats">
          <div className="account__journey-stat">
            <span className="account__journey-label">Projects Completed</span>
            <span className="account__journey-value">{user?.developerJourney?.projectsCompleted ?? 0}</span>
          </div>
          <div className="account__journey-stat">
            <span className="account__journey-label">Challenges Solved</span>
            <span className="account__journey-value">{user?.developerJourney?.challengesSolved ?? 0}</span>
          </div>
          <div className="account__journey-stat">
            <span className="account__journey-label">Endorsements</span>
            <span className="account__journey-value">{user?.endorsements?.length ?? 0}</span>
          </div>
          <div className="account__journey-stat">
            <span className="account__journey-label">Achievements Unlocked</span>
            <span className="account__journey-value">{user?.developerJourney?.achievementsUnlocked ?? 0}</span>
          </div>
          <div className="account__journey-stat">
            <span className="account__journey-label">Team Contributions</span>
            <span className="account__journey-value">{user?.developerJourney?.teamContributions ?? 0} tasks</span>
          </div>
        </div>
      </div>

      <div className="account__section">
        <div className="account__card-title" style={{ marginBottom: 16 }}>
          Badges & Achievements
        </div>
        {user?.developerJourney?.gamifiedBadges?.length > 0 ? (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {user.developerJourney.gamifiedBadges.map(badge => (
              <div key={badge.id} style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: 'calc(50% - 6px)'
              }}>
                <div style={{ background: '#121214', color: '#ffffff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text-dark)' }}>{badge.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="account__muted" style={{ fontStyle: 'italic' }}>
            No badges unlocked yet. Start completing tasks to earn them!
          </div>
        )}
      </div>

      <div className="account__section">
        <div className="account__card-title" style={{ marginBottom: 16 }}>
          Peer Endorsements
        </div>
        {user?.endorsements?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user.endorsements.map((e, idx) => (
              <div key={idx} style={{ 
                background: 'var(--color-paper)', 
                padding: '14px', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--color-text-dark)', fontSize: '13px' }}>{e.endorsedBy?.name || 'Unknown'}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {new Date(e.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-dark)', fontStyle: 'italic' }}>
                  "{e.text}"
                </p>
                {e.skills?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {e.skills.map(s => (
                      <span key={s} style={{ 
                        background: '#F4F3EF', 
                        color: '#33333A', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        border: '1px solid rgba(18,18,20,0.12)'
                      }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="account__muted" style={{ fontStyle: 'italic' }}>
            No endorsements yet. Work on projects with your team to earn them!
          </div>
        )}
      </div>
    </div>
  );
}
