import { Link } from 'react-router-dom';
import './Landing.css';

const STATS = [
  { value: '500+', label: 'Active Projects' },
  { value: '2,400+', label: 'Builders Registered' },
  { value: '120+', label: 'Skills Covered' },
  { value: '98%', label: 'Team Match Rate' },
];

const FEATURES = [
  {
    title: 'Browse Projects',
    desc: 'Explore hundreds of live projects across every discipline — design, engineering, research, and more. Filter by skill, status, or interest.',
    link: '/projects',
    cta: 'Explore Projects',
  },
  {
    title: 'Create & Lead',
    desc: 'Pitch your idea, define roles, and recruit the exact talent your project needs. Full control from inception to delivery.',
    link: '/projects/create',
    cta: 'Start a Project',
  },
  {
    title: 'Team Workspace',
    desc: 'Your project hub — task boards, team chat, milestones, and file sharing. Everything your team needs in one place.',
    link: '/projects',
    cta: 'See Workspace',
  },
  {
    title: 'Applications',
    desc: 'Apply to projects you believe in, or invite talented builders directly. Track every application in real time.',
    link: '/applications/sent',
    cta: 'View Applications',
  },
];

const STEPS = [
  {
    title: 'Create an Account',
    desc: 'Sign up in seconds. No friction, no noise — just your profile and what you can build.',
  },
  {
    title: 'Find or Start a Project',
    desc: 'Browse what others are building or launch your own. Define skills needed and set the vision.',
  },
  {
    title: 'Build Together',
    desc: 'Work inside your team workspace — plan, collaborate, ship. The entire lifecycle, one platform.',
  },
];

export default function Landing() {
  return (
    <div className="landing">

      {/* ── HERO ── */}
      <section className="landing__hero">
        <h1 className="landing__hero-title">
          PROJECTFORGE
        </h1>
        <p className="landing__hero-subtitle">
          BUILD WHAT MATTERS
        </p>

        <p className="landing__hero-sub">
          Discover projects. Form teams. Ship together.<br />
          ProjectForge connects builders with the ideas worth working on.
        </p>
        <div className="landing__hero-actions">
          <Link to="/projects" className="landing__btn landing__btn--primary">
            Explore Projects
          </Link>
          <Link to="/register" className="landing__btn landing__btn--ghost">
            Get Started
          </Link>
        </div>

        <div className="landing__hero-divider" />
      </section>

      {/* ── STATS ── */}
      <section className="landing__stats">
        {STATS.map((s) => (
          <div key={s.label} className="landing__stat">
            <span className="landing__stat-value">{s.value}</span>
            <span className="landing__stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="landing__features">
        <div className="landing__section-header">
          <h2 className="landing__section-title">Everything You Need</h2>
          <p className="landing__section-sub">
            From discovery to delivery — ProjectForge covers the full project lifecycle.
          </p>
        </div>
        <div className="landing__features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="landing__feature-card">
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-desc">{f.desc}</p>
              <Link to={f.link} className="landing__feature-link">
                {f.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing__how">
        <div className="landing__section-header">
          <h2 className="landing__section-title">How It Works</h2>
          <p className="landing__section-sub">
            Three steps from idea to execution.
          </p>
        </div>
        <div className="landing__steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="landing__step">
              <div className="landing__step-connector">
                <div className="landing__step-dot" />
                {i < STEPS.length - 1 && <div className="landing__step-line" />}
              </div>
              <div className="landing__step-body">
                <h3 className="landing__step-title">{s.title}</h3>
                <p className="landing__step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing__cta">
        <h2 className="landing__cta-title">Ready to Build?</h2>
        <p className="landing__cta-sub">
          Join thousands of builders already shipping projects on ProjectForge.
        </p>
        <div className="landing__hero-actions">
          <Link to="/register" className="landing__btn landing__btn--primary">
            Create Account
          </Link>
          <Link to="/projects" className="landing__btn landing__btn--ghost">
            Browse Projects
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing__footer">
        <span className="landing__footer-brand">PROJECTFORGE</span>
        <span className="landing__footer-copy">© 2026. Built for builders.</span>
      </footer>

    </div>
  );
}

