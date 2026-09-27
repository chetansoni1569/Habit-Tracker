import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Settings, LogOut, ChevronDown, TrendingUp } from 'lucide-react';

export default function TopNav() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getInitial = () => {
    if (profile?.name) return profile.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-links">
        <button
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
          onClick={() => navigate('/analytics')}
        >
          Analytics
        </button>
        <button
          className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          Profile
        </button>
        <button
          className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>
      </div>

      <div className="profile-menu-container" ref={dropdownRef}>
        <button
          className="profile-trigger"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Profile menu"
          aria-expanded={dropdownOpen}
        >
          <div className="profile-avatar">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.name || 'Profile'} />
            ) : (
              getInitial()
            )}
          </div>
          <span className="profile-name-nav">{profile?.name || 'User'}</span>
          <ChevronDown size={14} style={{ color: 'var(--text-light)' }} />
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown" role="menu">
            <button
              className="profile-dropdown-item"
              onClick={() => { navigate('/analytics'); setDropdownOpen(false); }}
              role="menuitem"
            >
              <TrendingUp size={14} />
              Analytics & History
            </button>
            <button
              className="profile-dropdown-item"
              onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
              role="menuitem"
            >
              <User size={14} />
              Profile
            </button>
            <button
              className="profile-dropdown-item"
              onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
              role="menuitem"
            >
              <Settings size={14} />
              Settings
            </button>
            <div className="profile-dropdown-divider"></div>
            <button
              className="profile-dropdown-item"
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
