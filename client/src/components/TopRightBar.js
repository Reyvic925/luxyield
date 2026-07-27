import React, { useEffect, useRef, useState } from 'react';
import { FiBell, FiChevronDown, FiMoon, FiSun } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../hooks/useTheme';

const TopRightBar = ({ hasNewAnnouncement = false }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // TopRightBar no longer measures itself or updates layout variables. It renders inline within the header.


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    navigate('/dashboard/announcements');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name || 'Victor Agapiah';
  const displayEmail = user?.email || 'victor@email.com';

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl border theme-aware-border-secondary theme-aware-bg-primary theme-aware-text backdrop-blur shadow-sm">
      <button
        type="button"
        onClick={handleNotificationClick}
        className="relative inline-flex items-center justify-center p-3 rounded-full border theme-aware-border-secondary theme-aware-bg-secondary theme-aware-text hover:bg-gold/10 transition"
        aria-label="Notifications"
        title="Notifications"
      >
        <FiBell className="text-gold text-xl" />
        {hasNewAnnouncement && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg"></span>}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center justify-center p-3 rounded-full border theme-aware-border-secondary theme-aware-bg-secondary theme-aware-text hover:bg-gold/10 transition"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {isDark ? <FiSun className="text-gold text-xl" /> : <FiMoon className="text-gold text-xl" />}
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border theme-aware-border-secondary theme-aware-bg-secondary theme-aware-text px-3 py-2 hover:bg-gold/10 transition"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <FiChevronDown className="text-xl" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border theme-aware-border-secondary theme-aware-bg-primary theme-aware-text shadow-xl overflow-hidden">
            <div className="px-4 py-4">
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-gray-400 break-all">{displayEmail}</p>
            </div>
            <div className="border-t theme-aware-border-secondary"></div>
            <div className="flex flex-col py-2">
              <Link
                to="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2 text-sm hover:bg-gold/10 transition"
              >
                My Profile
              </Link>
              <Link
                to="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2 text-sm hover:bg-gold/10 transition"
              >
                Settings
              </Link>
              <Link
                to="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2 text-sm hover:bg-gold/10 transition"
              >
                Security
              </Link>
              <Link
                to="/dashboard/education"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2 text-sm hover:bg-gold/10 transition"
              >
                Help Center
              </Link>
            </div>
            <div className="border-t theme-aware-border-secondary"></div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopRightBar;

