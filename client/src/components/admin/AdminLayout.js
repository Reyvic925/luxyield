// src/components/admin/AdminLayout.js
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiDownload, FiSettings, FiHome, FiBell, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAdminAuth } from '../../auth/AdminAuthProvider';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // default open on desktop
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={
      `flex h-screen font-sans text-base relative transition-colors duration-300 overflow-hidden ${darkMode ? 'bg-black text-gray-100' : 'bg-white text-gray-900'}`
    }>
      {/* Theme Toggle Button */}
      <button
        className="fixed top-6 right-6 z-50 bg-gray-900 bg-opacity-80 p-2 rounded-lg text-gold hover:bg-gray-800 transition md:right-8"
        onClick={() => setDarkMode((prev) => !prev)}
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-sun"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-moon"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
        )}
      </button>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
            <aside
        className={`${isMobile ? 'fixed' : 'sticky top-0'} h-screen ${
          sidebarOpen ? 'w-64' : 'w-14'
        } ${
          darkMode
            ? 'bg-gradient-to-b from-gray-950 to-gray-900 border-gray-800'
            : 'bg-gradient-to-b from-gray-100 to-white border-gray-200'
        } border-r shadow-lg z-40 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 relative`}
        style={{
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out'
        }}
        aria-hidden={!sidebarOpen && isMobile}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-gold hover:bg-gray-700 transition-colors border border-gray-700 cursor-pointer z-50 shadow-lg"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
        </button>

        <div className={`flex items-center h-20 px-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <span className={`text-2xl font-extrabold tracking-widest ${darkMode ? 'text-gold' : 'text-yellow-700'} transition-all duration-300 ${!sidebarOpen ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>LUXHEDGE</span>
          <button className="ml-auto text-gray-400 hover:text-gold" onClick={() => setSidebarOpen(false)} style={{display: sidebarOpen && !isMobile ? 'block' : 'none'}} aria-label="Collapse sidebar">
            <FiChevronLeft size={24} />
          </button>
          <button className="ml-auto md:hidden text-gray-400 hover:text-gold" onClick={() => setSidebarOpen(false)} style={{display: isMobile ? 'block' : 'none'}}>&times;</button>
        </div>
        <nav className={`flex-1 py-8 ${sidebarOpen ? 'px-4' : 'px-1'} space-y-2 overflow-y-auto`}>
          {[
            { to: "/admin", icon: <FiHome size={20} />, label: "Dashboard" },
            { to: "/admin/users", icon: <FiUsers size={20} />, label: "Users" },
            { to: "/admin/funds", icon: <FiDollarSign size={20} />, label: "Funds" },
            { to: "/admin/deposits", icon: <FiDollarSign size={20} />, label: "Deposits" },
            { to: "/admin/withdrawals", icon: <FiDownload size={20} />, label: "Withdrawals" },
            { to: "/admin/settings", icon: <FiSettings size={20} />, label: "Settings" },
            { to: "/admin/send-email", icon: <FiSettings size={20} />, label: "Send Email" },
            { to: "/admin/announcements", icon: <FiBell size={20} />, label: "Announcements" },
            { to: "/admin/support", icon: <FiBell size={20} />, label: "Support Chat" },
            { to: "/admin/mirror", icon: <FiUsers size={20} />, label: "Mirror User" },
            { to: "/admin/roi-approvals", icon: <FiSettings size={20} />, label: "ROI Approvals" }
          ].map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-3 rounded-lg transition-all hover:bg-gray-800 text-gray-200 hover:text-gold font-medium group relative`}
            >
              <div className={`${sidebarOpen ? 'mr-3' : 'mr-0'} text-lg transition-all duration-300`}>
                {icon}
              </div>
              <span className={`transition-all duration-300 whitespace-nowrap ${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                {label}
              </span>
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 py-1 px-2 bg-gray-800 text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </Link>
          ))}
        </nav>
        <div className={`px-4 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center transition-all duration-300`}>
          <div className="group relative">
            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700 text-gold hover:bg-gray-600' : 'bg-gray-200 text-yellow-700 hover:bg-gray-300'} flex items-center justify-center text-lg font-bold cursor-pointer transition-colors`}>
              {admin?.name?.charAt(0) || 'A'}
            </div>
            {!sidebarOpen && (
              <div className="absolute left-full bottom-0 ml-2 py-1 px-2 bg-gray-800 text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {admin?.name || 'Admin'}
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className={`ml-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'} flex-1`}>
              <div className="font-semibold">{admin?.name || 'Admin'}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={logout}
              className={`ml-4 px-4 py-2 rounded-lg font-semibold transition ${darkMode ? 'bg-gray-900 text-red-400 hover:bg-red-900 hover:text-white' : 'bg-gray-100 text-red-600 hover:bg-red-200 hover:text-white'}`}
            >
              Logout
            </button>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <main
        className={`flex-1 h-screen ${darkMode ? 'bg-black text-gray-100' : 'bg-white text-gray-900'} overflow-y-auto flex flex-col transition-all duration-300`}
        style={{ 
          width: `calc(100% - ${isMobile ? '0px' : (sidebarOpen ? '16rem' : '4rem')})`,
          marginLeft: 'auto',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <div className="w-full flex-1 flex flex-col min-h-screen p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;