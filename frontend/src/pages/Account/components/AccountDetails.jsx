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
        <div className="account__card-title" style={{ marginBottom: 10 }}>
          Stats
        </div>
        <div className="account__kv">
          <div className="account__kvi">
            <div className="account__kvi-label">Projects Active</div>
            <div className="account__kvi-value">{user?.stats?.projectsActive ?? 0}</div>
          </div>
          <div className="account__kvi">
            <div className="account__kvi-label">Projects Completed</div>
            <div className="account__kvi-value">{user?.stats?.projectsCompleted ?? 0}</div>
          </div>
          <div className="account__kvi">
            <div className="account__kvi-label">Tasks Completed</div>
            <div className="account__kvi-value">{user?.stats?.tasksCompleted ?? 0}</div>
          </div>
          <div className="account__kvi">
            <div className="account__kvi-label">Applications Sent</div>
            <div className="account__kvi-value">{user?.stats?.applicationsSent ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
