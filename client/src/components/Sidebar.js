// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiPieChart, FiDollarSign, FiUpload, 
         FiTrendingUp, FiShield, FiBell,
         FiTarget, FiBook, FiMenu, FiX, FiUsers } from 'react-icons/fi';
import '../custom-scrollbar.css';

const Sidebar = ({ collapsed = false, setCollapsed = () => {}, hasNewAnnouncement = false, mobileOpen = false, setMobileOpen = () => {} }) => {
  // Sidebar no longer measures or sets global layout variables. Layout owns spacing.
  // mobileOpen is controlled by the parent layout to toggle the overlay on small screens.


  const navItems = [
    { icon: <FiHome />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FiPieChart />, label: 'Portfolio', path: '/dashboard/portfolio' },
    { icon: <FiDollarSign />, label: 'Deposit', path: '/dashboard/deposit' },
    { icon: <FiUpload />, label: 'Withdraw', path: '/dashboard/withdraw' },
    { icon: <FiTrendingUp />, label: 'Investments', path: '/dashboard/performance' },
    { icon: <FiShield />, label: 'KYC', path: '/dashboard/kyc' },
    { icon: <FiTarget />, label: 'Goals', path: '/dashboard/goals' },
    { icon: <FiUsers />, label: 'Referrals', path: '/dashboard/invite-friends' },
    { icon: (
        <span className="relative">
          <FiBell />
          {hasNewAnnouncement && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </span>
      ), label: 'Announcements', path: '/dashboard/announcements' },
    { icon: <FiBook />, label: 'Education Center', path: '/dashboard/education' },
  ];

  // Desktop collapse/expand
  const handleCollapse = () => setCollapsed(!collapsed);

  // Only render sidebar for user (not admin routes)
  if (window.location.pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Sidebar for desktop and mobile */}
      <div
        className={`glassmorphic theme-aware-bg-primary theme-aware-text transition-all duration-500 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          h-screen md:h-auto min-h-full flex flex-col scrollbar-thin scrollbar-thumb-gold sidebar-scrollbar
          fixed md:static top-0 left-0 z-40
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          theme-aware-border-secondary border-r
        `}
        style={{ minHeight: '100vh', height: '100%', overflowY: 'auto', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Collapse/Expand button above Dashboard icon (desktop only) */}
        <div className="pt-6 pl-2 pr-2">
          <button
            onClick={handleCollapse}
            className="hidden md:block mb-4 bg-gold text-black p-2 rounded-full shadow-lg transition-transform duration-300 hover:scale-110"
          >
            {collapsed ? <FiMenu size={22} /> : <FiX size={22} />}
          </button>
          {/* Remove close button for mobile, handled by hamburger toggle above */}
        </div>
        <nav className="flex-1">
          <ul className="flex flex-col items-start w-full pb-24 md:pb-0">
            {navItems.map((item, index) => (
              <li key={index} className="mb-2 w-full transition-all duration-300">
                <Link
                  to={item.path}
                  className={`flex items-center p-4 sm:p-3 rounded-lg hover:bg-gold hover:bg-opacity-10 hover:text-gold transition-all duration-300 theme-aware-text ${collapsed ? 'justify-center' : 'justify-start'} w-full`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="mr-3 text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                  {!collapsed && <span className="transition-opacity duration-300">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 theme-overlay z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;

