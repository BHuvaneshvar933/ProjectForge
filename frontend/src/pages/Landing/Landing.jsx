import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import imgBlack from '../../assets/faces/black.png';
import imgWhite from '../../assets/faces/white.png';
import footerLight from '../../assets/logo/footer/light.jpg';
import footerDark from '../../assets/logo/footer/dark.jpg';
import './Landing.css';

const CHAPTERS = [
  {
    num: '01',
    category: 'DISCOVERY ENGINE',
    title: 'Curated Projects & Talent Matchmaking',
    desc: 'Explore active builds across web development, machine learning, mobile apps, and hackathons. Match scores evaluate your overlapping skillsets to highlight ideal opportunities.',
    topics: ['Algorithm-Assisted Matching', 'Custom Search & Filters', 'Direct Talent Invites', 'Live Status Tracking'],
    link: '/projects',
    cta: 'Explore Catalog',
  },
  {
    num: '02',
    category: 'PROJECT ARCHITECTURE',
    title: 'Pitching Ideas & Recruiting Teams',
    desc: 'Launch a project in minutes. Define required roles, set project timelines, publish open positions, and review incoming candidate applications in real time.',
    topics: ['Structured Pitch Forms', 'Multi-Step Role Allocations', 'Applicant Review Management', 'Custom Milestones'],
    link: '/projects/create',
    cta: 'Launch a Project',
  },
  {
    num: '03',
    category: 'EXECUTION & WORKSPACE',
    title: 'Integrated Realtime Workspace',
    desc: 'Collaborate inside a unified project hub. Manage Kanban task boards, chat with teammates via socket DMs, share release notes, and track project analytics.',
    topics: ['Kanban Task Boards', 'Socket Real-time DM Engine', 'Release Log Management', 'Team Activity Stream'],
    link: '/projects',
    cta: 'View Workspace',
  },
];

export default function Landing() {
  const [typedText, setTypedText] = useState('');
  const [introState, setIntroState] = useState('typing'); // 'typing' | 'moving' | 'hidden'
  const [downloadNotice, setDownloadNotice] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('pf_intro_played')) {
        setIntroState('hidden');
        return;
      }
    } catch {
      /* ignore storage access error */
    }

    const fullText = 'PROJECTFORGE';
    let index = 0;
    let isDeleting = false;

    const timer = setInterval(() => {
      if (!isDeleting) {
        if (index <= fullText.length) {
          setTypedText(fullText.slice(0, index));
          index++;
        } else {
          // Pause at full word before untyping
          isDeleting = true;
          setTimeout(() => {}, 400);
        }
      } else {
        if (index >= 0) {
          setTypedText(fullText.slice(0, index));
          index--;
        } else {
          clearInterval(timer);
          setIntroState('fading');
          try {
            sessionStorage.setItem('pf_intro_played', 'true');
          } catch {
            /* ignore storage access error */
          }
          setTimeout(() => {
            setIntroState('hidden');
          }, 400);
        }
      }
    }, 70);

    return () => clearInterval(timer);
  }, []);

  const handleDownloadWindows = () => {
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 5000);
  };

  return (
    <div className="landing-publication">
      {/* ── INTRO TYPE & UNTYPE OVERLAY ── */}
      {introState !== 'hidden' && (
        <div 
          className="intro-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'var(--color-paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.4s ease',
            opacity: introState === 'fading' ? 0 : 1,
            pointerEvents: introState === 'fading' ? 'none' : 'all',
          }}
        >
          <div>
            <h1 
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
                fontWeight: 900,
                letterSpacing: '0.02em',
                color: 'var(--color-text-dark)',
                fontFamily: "'Google Sans', 'Inter', system-ui, sans-serif",
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {typedText}
              <span style={{ opacity: 0.6 }}>|</span>
            </h1>
          </div>
        </div>
      )}

      {/* WINDOWS DOWNLOAD NOTIFICATION TOAST */}
      {downloadNotice && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: '#121214',
            color: '#FFFFFF',
            padding: '14px 24px',
            borderRadius: '999px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.95-9.6L24 0v11.4H10.95M0 12.6h9.75v9.451L0 20.699M10.95 12.6H24V24l-13.05-1.8" />
          </svg>
          Starting ProjectForge Desktop App v2.4 (Windows 64-bit)...
        </div>
      )}

      {/* ── HERO VIEWPORT (100vh FULL SCREEN) ── */}
      <header className="pub-hero">
        <div className="pub-hero__container">
          <div className="pub-hero__grid">
            <div className="pub-hero__left">
              <h1 className="pub-hero__title">
                The Ecosystem for Independent Builders & Collaborative Ships.
              </h1>

              <div className="pub-hero__body-row">
                <p className="pub-hero__abstract">
                  ProjectForge connects software engineers, designers, and researchers with the ideas worth working on. From discovery to delivery. Explore curated builds, assemble cross-disciplinary teams, and ship together.
                </p>

                <div className="pub-hero__actions">
                  <Link to="/projects" className="pub-btn pub-btn--primary">
                    Explore Projects
                  </Link>
                  <Link to="/register" className="pub-btn pub-btn--secondary">
                    Get Started
                  </Link>
                  <button 
                    onClick={handleDownloadWindows} 
                    className="pub-btn pub-btn--windows"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 3.449L9.75 2.1v9.451H0m10.95-9.6L24 0v11.4H10.95M0 12.6h9.75v9.451L0 20.699M10.95 12.6H24V24l-13.05-1.8" />
                    </svg>
                    Download for Windows
                  </button>
                </div>
              </div>
            </div>

            <div className="pub-hero__right">
              <img 
                src={isDarkMode ? imgWhite : imgBlack} 
                alt="ProjectForge Logo Showcase" 
                className="pub-hero__showcase-img"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── CHAPTER STORIES SECTION ── */}
      <section className="pub-chapters">
        {CHAPTERS.map((ch) => (
          <article key={ch.num} className="pub-chapter-block">
            <div className="pub-chapter-block__inner">
              <div className="pub-chapter-block__content">
                <h2 className="pub-chapter-block__title">{ch.title}</h2>
                <p className="pub-chapter-block__desc">{ch.desc}</p>

                <div className="pub-chapter-block__topics">
                  <span className="pub-chapter-block__topics-label">TOPICS COVERED:</span>
                  <div className="pub-chapter-block__topics-single-card">
                    {ch.topics.map((t, i) => (
                      <span key={i} className="pub-chapter-block__topic-item">
                        <span>{t}</span>
                        {i < ch.topics.length - 1 && <span className="pub-chapter-block__slash">/</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pub-chapter-block__action">
                  <Link to={ch.link} className="pub-btn pub-btn--primary">
                    {ch.cta}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ── EDITORIAL PULL QUOTE ── */}
      <section className="pub-quote">
        <div className="pub-quote__container">
          <blockquote className="pub-quote__text font-serif">
            Software is no longer built in isolation. The future belongs to modular, skill-matched teams coming together around shared vision and shipping without friction.
          </blockquote>
          <div className="pub-quote__attribution">
            <strong>ProjectForge Research Insight</strong>
          </div>
        </div>
      </section>

      {/* ── CLOSING CALL TO ACTION ── */}
      <section className="pub-cta">
        <div className="pub-cta__container">
          <h2 className="pub-cta__title">Ready to Launch or Join a Team?</h2>
          <p className="pub-cta__desc">
            Become part of the ProjectForge network. Submit your project pitch or apply to active engineering teams today.
          </p>
          <div className="pub-cta__actions">
            <Link to="/register" className="pub-btn pub-btn--primary">
              Create Your Account
            </Link>
            <Link to="/projects" className="pub-btn pub-btn--outline">
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* ── PUBLICATION FOOTER ── */}
      <footer className="pub-footer">
        <div className="pub-footer__container">
          <div className="pub-footer__brand">
            <img 
              src={isDarkMode ? footerDark : footerLight} 
              alt="ProjectForge" 
              className="pub-footer__logo-img"
            />
          </div>
        </div>
      </footer>

    </div>
  );
}

