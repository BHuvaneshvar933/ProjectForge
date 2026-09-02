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
          Reliability Status <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--color-text-muted)", marginLeft: "8px", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px" }}>Private to you</span>
        </div>
        <div style={{ background: "var(--color-paper)", padding: 16, borderRadius: 8, border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>Current Status</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                {user?.reliability?.status === "RELIABLE" ? "🟢 Reliable Collaborator" :
                 user?.reliability?.status === "CAUTION" ? "🟡 Caution" :
                 user?.reliability?.status === "CONCERN" ? "🔴 Concern" :
                 "⚪ Developing"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>Confidence Level</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-dark)" }}>
                {user?.reliability?.confidence || "INSUFFICIENT"}
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5, borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
            <p style={{ margin: 0, marginBottom: "8px" }}>
              <strong>Reliability Status</strong> reflects your track record. Project owners only see your status if you are "Reliable" or "Developing" — negative statuses are kept private to give you a chance to recover.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Confidence Level</strong> indicates how much history we have to back up this status. Join projects you're reasonably confident you can commit to, and communicate with your team if circumstances change.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 16, background: "var(--color-paper)", padding: 16, borderRadius: 8, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-dark)", marginBottom: 12 }}>Reliability History</div>
          
          <div style={{ display: "flex", gap: "32px", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-dark)" }}>{user?.reliability?.evidence?.totalProjects || 0}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Projects Joined</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-dark)" }}>{user?.reliability?.evidence?.successfulParticipations || 0}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Meaningful Completions</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-dark)" }}>{user?.reliability?.evidence?.protectedDepartures || 0}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Protected Departures</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5, borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
            Your reliability history is developing. Continue participating in projects successfully to build your collaboration history.
          </div>
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

    </div>
  );
}
