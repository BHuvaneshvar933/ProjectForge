import { Link, useLocation } from "react-router-dom";
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  
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
        </div>
      </div>
    </nav>
  );
}