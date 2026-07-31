import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./common/NotificationBell";
import topNavbarIcon from "../assets/logo/top-navbar.jpg";
import { Sun, Moon } from "lucide-react";
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState(window.localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
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

  // Hide the navbar on authentication routes for a cleaner, distraction-free UI
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

  return (
    <nav className={`navbar ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <img src={topNavbarIcon} alt="ProjectForge Logo" className="navbar__logo-img" />
        </Link>

        <div className="navbar__links">
          <Link
            to="/projects"
            className={`navbar__link ${isActive('/projects') ? 'is-active' : ''}`.trim()}
          >
            Explore
          </Link>

          {/* <Link
            to="/learning-archive"
            className={`navbar__link ${isActive('/learning-archive') ? 'is-active' : ''}`.trim()}
          >
            Archive
          </Link> */}

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
            <div className="navbar__link" style={{ padding: 0 }}>
              <NotificationBell />
            </div>
          )}

          {!isAuthed ? (
            <>
              <Link
                to="/login"
                className={`navbar__link ${isActive('/login') ? 'is-active' : ''}`.trim()}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`navbar__link ${isActive('/register') ? 'is-active' : ''}`.trim()}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar__link"
              >
                Logout
              </button>
            </>
          )}

          <button
            type="button"
            className="navbar__link un-invert"
            style={{ display: "flex", alignItems: "center", padding: "8px", background: "transparent", border: "none", cursor: "pointer", marginLeft: "10px" }}
            onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} color="rgba(255,255,255,0.8)" /> : <Moon size={18} color="#000" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
