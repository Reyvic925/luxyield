import React from 'react';
import { FiSettings, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../hooks/useTheme';

const TopRightBar = () => {
  const { logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-2 rounded-xl border theme-aware-border-secondary theme-aware-bg-primary theme-aware-text backdrop-blur shadow-lg">
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center justify-center p-3 rounded-full border theme-aware-border-secondary theme-aware-bg-secondary theme-aware-text hover:bg-gold/10 transition"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {isDark ? <FiSun className="text-gold text-xl" /> : <FiMoon className="text-gold text-xl" />}
      </button>
      <Link
        to="/dashboard/settings"
        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-black font-bold hover:bg-yellow-500 transition"
      >
        <FiSettings className="text-xl" />
        <span>Settings</span>
      </Link>
      <button
        onClick={handleLogout}
        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
      >
        <FiLogOut className="text-xl" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default TopRightBar;

