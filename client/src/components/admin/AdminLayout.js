// src/components/admin/AdminLayout.js
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiDownload, FiSettings, FiHome, FiBell, FiMail, FiList, FiArrowUpRight, FiDatabase, FiShield, FiMoon, FiSun } from 'react-icons/fi';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { useTheme } from '../../hooks/useTheme';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  const navItems = [
    { to: '/admin', icon: <FiHome size={22} />, label: 'Dashboard', description: 'Overview & Quick Links' },
    { to: '/admin/users', icon: <FiUsers size={22} />, label: 'Users', description: 'Manage all users' },
    { to: '/admin/funds', icon: <FiDollarSign size={22} />, label: 'Funds', description: 'Fund listings & settings' },
    { to: '/admin/deposits', icon: <FiArrowUpRight size={22} />, label: 'Deposits', description: 'Deposit requests' },
    { to: '/admin/roi-approvals', icon: <FiShield size={22} />, label: 'ROI Approvals', description: 'Unlock ROI balances' },
    { to: '/admin/withdrawals', icon: <FiDownload size={22} />, label: 'Withdrawals', description: 'Withdrawal requests' },
    { to: '/admin/settings', icon: <FiSettings size={22} />, label: 'Settings', description: 'Platform settings' },
    { to: '/admin/send-email', icon: <FiMail size={22} />, label: 'Send Email', description: 'Email broadcasts' },
    { to: '/admin/announcements', icon: <FiBell size={22} />, label: 'Announcements', description: 'Manage announcements' },
    { to: '/admin/mirror', icon: <FiList size={22} />, label: 'Mirror User', description: 'Mirror user sessions' },
    { to: '/admin/cold-wallet', icon: <FiDatabase size={22} />, label: 'Cold Wallet', description: 'Cold wallet controls' },
    { to: '/admin/plans', icon: <FiSettings size={22} />, label: 'Plans', description: 'Manage plans' },
    { to: '/admin/user-investments', icon: <FiDollarSign size={22} />, label: 'Investments', description: 'Manage user investments' }
  ];

  return (
    <div 
      className="min-h-screen relative transition-colors duration-300 theme-aware-bg-primary theme-aware-text"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-opacity-95 backdrop-blur-md border-b theme-aware-border-secondary transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold text-black flex items-center justify-center font-extrabold text-lg">L</div>
            <div>
              <div className="text-xl font-bold tracking-wider">LuxHedge Admin</div>
              <div className="theme-aware-text-secondary text-xs">{admin?.name ? `Logged in as ${admin.name}` : 'Administrator panel'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              className="px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 theme-aware-bg-secondary theme-aware-border-secondary border"
              title="Toggle theme"
            >
              {isDark ? <FiSun size={18} className="text-gold" /> : <FiMoon size={18} className="text-gold" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg text-white hover:opacity-90 transition-opacity bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {navItems.map(({ to, icon, label, description }) => (
            <Link
              key={to}
              to={to}
              className="group block rounded-3xl p-5 text-left transition-all duration-300 theme-aware-bg-secondary theme-aware-border-secondary border hover:border-gold"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-gold mb-4 transition-all duration-300 theme-aware-bg-tertiary"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {icon}
              </div>
              <div className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
              <p className="theme-aware-text-secondary text-sm leading-5">{description}</p>
            </Link>
          ))}
        </section>

        {/* Main Content Area */}
        <div 
          className="rounded-3xl border p-4 md:p-6 min-h-[60vh] transition-colors duration-300 theme-aware-bg-secondary theme-aware-border-secondary"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

