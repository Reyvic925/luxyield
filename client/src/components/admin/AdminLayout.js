// src/components/admin/AdminLayout.js
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiDownload, FiSettings, FiHome, FiBell, FiMail, FiList, FiArrowUpRight, FiShield, FiDatabase } from 'react-icons/fi';
import { useAdminAuth } from '../../auth/AdminAuthProvider';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const [darkMode, setDarkMode] = useState(true);

  const navItems = [
    { to: '/admin', icon: <FiHome size={22} />, label: 'Dashboard', description: 'Overview & Quick Links' },
    { to: '/admin/users', icon: <FiUsers size={22} />, label: 'Users', description: 'Manage all users' },
    { to: '/admin/funds', icon: <FiDollarSign size={22} />, label: 'Funds', description: 'Fund listings & settings' },
    { to: '/admin/deposits', icon: <FiArrowUpRight size={22} />, label: 'Deposits', description: 'Deposit requests' },
    { to: '/admin/withdrawals', icon: <FiDownload size={22} />, label: 'Withdrawals', description: 'Withdrawal requests' },
    { to: '/admin/settings', icon: <FiSettings size={22} />, label: 'Settings', description: 'Platform settings' },
    { to: '/admin/send-email', icon: <FiMail size={22} />, label: 'Send Email', description: 'Email broadcasts' },
    { to: '/admin/announcements', icon: <FiBell size={22} />, label: 'Announcements', description: 'Manage announcements' },
    { to: '/admin/mirror', icon: <FiList size={22} />, label: 'Mirror User', description: 'Mirror user sessions' },
    { to: '/admin/roi-approvals', icon: <FiShield size={22} />, label: 'ROI Approvals', description: 'Approve ROI requests' },
    { to: '/admin/cold-wallet', icon: <FiDatabase size={22} />, label: 'Cold Wallet', description: 'Cold wallet controls' },
    { to: '/admin/plans', icon: <FiSettings size={22} />, label: 'Plans', description: 'Manage plans' },
    { to: '/admin/user-investments', icon: <FiDollarSign size={22} />, label: 'Investments', description: 'Manage user investments' }
  ];

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${darkMode ? 'bg-black text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="sticky top-0 z-40 bg-opacity-95 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold text-black flex items-center justify-center font-extrabold text-lg">L</div>
            <div>
              <div className="text-xl font-bold tracking-wider">LuxHedge Admin</div>
              <div className="text-xs text-gray-400">{admin?.name ? `Logged in as ${admin.name}` : 'Administrator panel'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="px-3 py-2 rounded-lg bg-gray-900 bg-opacity-80 text-gold hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {darkMode ? 'Light' : 'Dark'} mode
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {navItems.map(({ to, icon, label, description }) => (
            <Link
              key={to}
              to={to}
              className="group block rounded-3xl border border-gray-800 bg-gray-900 p-5 text-left transition hover:border-gold hover:bg-gray-800"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800 text-gold mb-4 transition group-hover:bg-gold group-hover:text-black">
                {icon}
              </div>
              <div className="text-base font-semibold mb-1 transition group-hover:text-gold">{label}</div>
              <p className="text-sm text-gray-400 leading-5">{description}</p>
            </Link>
          ))}
        </section>

        <div className="bg-gray-950 rounded-3xl border border-gray-800 p-4 md:p-6 min-h-[60vh]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

