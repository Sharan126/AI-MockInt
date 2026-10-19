import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import {
  BsCameraVideo,
  BsSunFill,
  BsMoonStarsFill,
  BsFileEarmarkCheck,
  BsStarFill,
  BsCashStack,
} from 'react-icons/bs';
import { MdDashboard, MdHistory, MdSettings, MdLogout } from 'react-icons/md';
import { FaUser } from 'react-icons/fa';
import './index.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <BsCameraVideo className="brand-icon" />
          <span className="brand-text">AI Mock Interview</span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'nav-link-active' : ''}`}
          >
            <MdDashboard className="nav-link-icon" />
            Dashboard
          </Link>
          <Link
            to="/star-bank"
            className={`nav-link ${location.pathname === '/star-bank' ? 'nav-link-active' : ''}`}
          >
            <BsStarFill className="nav-link-icon" />
            STAR Vault
          </Link>
          <Link
            to="/negotiate"
            className={`nav-link ${location.pathname === '/negotiate' ? 'nav-link-active' : ''}`}
          >
            <BsCashStack className="nav-link-icon" />
            Negotiate
          </Link>
          <Link
            to="/resume-optimizer"
            className={`nav-link ${location.pathname === '/resume-optimizer' ? 'nav-link-active' : ''}`}
          >
            <BsFileEarmarkCheck className="nav-link-icon" />
            ATS Studio
          </Link>
          <Link
            to="/history"
            className={`nav-link ${location.pathname === '/history' ? 'nav-link-active' : ''}`}
          >
            <MdHistory className="nav-link-icon" />
            History
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${location.pathname === '/settings' ? 'nav-link-active' : ''}`}
          >
            <MdSettings className="nav-link-icon" />
            Settings
          </Link>
        </div>
      </div>
      <div className="navbar-right">
        {/* Theme Toggle Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <BsSunFill className="theme-toggle-icon sun-icon" />
          ) : (
            <BsMoonStarsFill className="theme-toggle-icon moon-icon" />
          )}
        </button>

        {user && (
          <div className="navbar-user-section">
            <FaUser className="user-icon" />
            <span className="user-name">{user.name}</span>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <MdLogout className="logout-icon" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
