import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./common/NotificationBell";
import topNavbarIcon from "../assets/logo/top-navbar.jpg";
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      
      setScrollProgress(scrolled);
      setIsScrolled(winScroll > 15);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const token = (() => {
    try {
      return (
        window?.localStorage?.getItem("token") ||
        window?.localStorage?.getItem("pf_token") ||
        window?.localStorage?.getItem("projectforge_token") ||
        ""
      );
    } catch {
      return "";
    }
  })();

  const isAuthed = Boolean(token);

  const isAuthRoute = 
    location.pathname === "/login" || 
    location.pathname === "/register" || 
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  if (isAuthRoute) {
    return null;
  }

  const handleLogout = () => {
    try {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("pf_token");
      window.localStorage.removeItem("projectforge_token");
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("pf_user_id");
      window.localStorage.removeItem("projectforge_user_id");
    } catch {
      // ignore
    }

    navigate("/login");
  };

  const isActive = (path) => {
    if (path === '/projects') return location.pathname === '/projects';
    return location.pathname.startsWith(path);
  };

  const getChapterName = () => {
    if (location.pathname === "/") return "01 DISCOVER";
    if (location.pathname.startsWith("/projects/create")) return "02 ARCHITECT";
    if (location.pathname.startsWith("/workspace")) return "03 COLLABORATE";
    if (location.pathname.startsWith("/applications")) return "04 APPLICATIONS";
    if (location.pathname.startsWith("/learning-archive")) return "05 ARCHIVE";
    return "REPORT 2026";
  };

  return (
    <nav className={`navbar ${isScrolled ? 'is-scrolled' : ''}`}>
      {/* Scroll progress bar */}
      <div 
        className="navbar__progress" 
        style={{ width: `${scrollProgress}%` }} 
      />

      <div className="navbar__inner">
        <div className="navbar__left">
          <Link to="/" className="navbar__brand">
            <span className="navbar__brand-text">PROJECTFORGE</span>
          </Link>
        </div>

        <div className="navbar__links">
          <Link
            to="/projects"
            className={`navbar__link ${isActive('/projects') ? 'is-active' : ''}`.trim()}
          >
            Directory
          </Link>


          <Link
            to="/my-projects"
            className={`navbar__link ${isActive('/my-projects') ? 'is-active' : ''}`.trim()}
          >
            My Projects
          </Link>

          {isAuthed && (
            <Link
              to="/applications/sent"
              className={`navbar__link ${isActive('/applications/sent') ? 'is-active' : ''}`.trim()}
            >
              Applications
            </Link>
          )}

          {isAuthed && (
            <Link
              to="/account"
              className={`navbar__link ${isActive('/account') ? 'is-active' : ''}`.trim()}
            >
              Account
            </Link>
          )}

          {isAuthed && (
            <div className="navbar__link navbar__link--icon">
              <NotificationBell />
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="navbar__theme-toggle"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Night Mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {!isAuthed ? (
            <>
              <Link
                to="/login"
                className={`navbar__link ${isActive('/login') ? 'is-active' : ''}`.trim()}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="navbar__cta-btn"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar__link navbar__logout"
              >
                Sign Out
              </button>
              <Link
                to="/projects/create"
                className="navbar__cta-btn"
              >
                Start Project
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
