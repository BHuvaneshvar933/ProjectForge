import { Link, useLocation, useNavigate } from "react-router-dom";
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

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
    if (path === '/projects') return location.pathname === '/' || location.pathname === '/projects';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <div className="navbar__logo">
            <span className="navbar__logo-text">T</span>
          </div>
          <span className="navbar__title">TeamForge</span>
        </Link>
        
        <div className="navbar__links">
          <Link 
            to="/projects" 
            className={`navbar__link ${isActive('/projects') && !isActive('/my-projects') && !isActive('/projects/create') ? 'is-active' : ''}`.trim()}
          >
            Browse
          </Link>
          <Link 
            to="/my-projects" 
            className={`navbar__link ${isActive('/my-projects') ? 'is-active' : ''}`.trim()}
          >
            My Projects
          </Link>
          <Link 
            to="/projects/create" 
            className="navbar__create"
          >
            + Create
          </Link>

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
            <button
              type="button"
              onClick={handleLogout}
              className="navbar__link"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
