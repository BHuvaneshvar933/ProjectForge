import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h2 style={{
          fontWeight: 800,
          fontSize: '1.35rem',
          margin: 0,
          letterSpacing: '-0.03em',
          color: '#fff'
        }}>TeamForge</h2>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/projects" style={{ ...styles.link, background: '#fff', color: '#000' }}>Browse</Link>
        <Link to="/my-projects" style={styles.link}>My Projects</Link>
        <Link to="/profile" style={styles.link}>Profile</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 8vw",
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  link: {
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "0.9rem",
    padding: "8px 18px",
    borderRadius: 980,
    transition: "background 0.25s, color 0.25s",
    background: "none",
    letterSpacing: "-0.01em",
  },
};