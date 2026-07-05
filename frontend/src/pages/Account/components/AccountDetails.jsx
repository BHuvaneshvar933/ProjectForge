export default function AccountDetails({ user }) {
  return (
    <div className="account__card">
      <div className="account__card-title">Account Details</div>

      <div className="account__section">
        <div className="account__muted">Email</div>
        <div style={{ marginTop: 6, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
          {user.email || "-"}
        </div>
      </div>

      <div className="account__section">
        <div className="account__muted">Member Since</div>
        <div style={{ marginTop: 6, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
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
          Peer Endorsements
        </div>
        {user?.endorsements?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {user.endorsements.map((e, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>{e.endorsedBy?.name || 'Unknown'}</strong>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {new Date(e.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic' }}>
                  "{e.text}"
                </p>
                {e.skills?.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {e.skills.map(s => (
                      <span key={s} style={{ 
                        background: 'rgba(10, 132, 255, 0.1)', 
                        color: '#0a84ff', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        fontWeight: '600'
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
