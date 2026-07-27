import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown, FiMoon, FiSun } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../hooks/useTheme';

const TopRightBar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({ top: 0, right: 0, visibility: 'hidden' });

  // TopRightBar no longer measures itself or updates layout variables. It renders inline within the header.


  const handleLogout = () => {
    logout();
    navigate('/login');
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

  // Position the portal dropdown when it opens and update on resize/scroll
  useEffect(() => {
    if (!menuOpen) {
      setMenuStyle((s) => ({ ...s, visibility: 'hidden' }));
      return;
    }

    const computePosition = () => {
      try {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const preferredTop = rect.bottom + 8; // 8px gap
        const preferredRight = Math.max(8, window.innerWidth - rect.right);

        // temporarily set visibility hidden to measure menu size
        setMenuStyle({ top: preferredTop + 'px', right: preferredRight + 'px', visibility: 'hidden' });

        // measure after render
        requestAnimationFrame(() => {
          const menuEl = menuRef.current;
          if (!menuEl) {
            setMenuStyle({ top: preferredTop + 'px', right: preferredRight + 'px', visibility: 'visible' });
            return;
          }
          const menuRect = menuEl.getBoundingClientRect();
          // Clamp vertically
          let top = preferredTop;
          if (top + menuRect.height > window.innerHeight - 8) {
            top = Math.max(8, window.innerHeight - menuRect.height - 8);
          }
          // Clamp horizontally (ensure not beyond left edge)
          let right = preferredRight;
          const menuLeft = window.innerWidth - right - menuRect.width;
          if (menuLeft < 8) {
            // shift to keep within viewport
            right = Math.max(8, window.innerWidth - 8 - menuRect.width);
          }

          setMenuStyle({ top: top + 'px', right: right + 'px', visibility: 'visible' });
        });
      } catch (err) {
        // fallback: position near top-right
        setMenuStyle({ top: '48px', right: '8px', visibility: 'visible' });
      }
    };

    computePosition();
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [menuOpen]);

  const displayName = user?.name || 'Victor Agapiah';
  const displayEmail = user?.email || 'victor@email.com';

  return (
    <div className="flex items-center gap-2 p-2 md:p-2 rounded-xl border theme-aware-border-secondary theme-aware-bg-primary theme-aware-text backdrop-blur shadow-sm">
      {/* Notification icon removed to save space on mobile */}
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center justify-center p-2 md:p-3 rounded-full border theme-aware-border-secondary theme-aware-bg-secondary theme-aware-text hover:bg-gold/10 transition"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {isDark ? <FiSun className="text-gold text-lg md:text-xl" /> : <FiMoon className="text-gold text-lg md:text-xl" />}
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          ref={triggerRef}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border theme-aware-border-secondary theme-aware-bg-secondary theme-aware-text px-2 py-1 hover:bg-gold/10 transition"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="inline-flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gold text-black font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <FiChevronDown className="text-lg md:text-xl" />
        </button>

        {menuOpen && (() => {
          // Build the dropdown menu element
          const menuElement = (
            <div ref={menuRef} className="w-72 rounded-2xl border theme-aware-border-secondary theme-aware-bg-primary theme-aware-text shadow-xl overflow-hidden" style={{ position: 'fixed', top: menuStyle.top, right: menuStyle.right, backgroundColor: 'var(--bg-primary)', backdropFilter: 'none', zIndex: 9999, visibility: menuStyle.visibility }}>
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
          );

          // If document is available, portal the dropdown to body to avoid stacking context issues
          try {
            if (typeof document !== 'undefined' && document.body && React && ReactDOM && ReactDOM.createPortal) {
              return ReactDOM.createPortal(menuElement, document.body);
            }
          } catch (e) {
            // ignore and render inline fallback
          }

          return menuElement;
        })()}
      </div>
    </div>
  );
};

export default TopRightBar;

