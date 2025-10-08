// src/components/admin/AdminLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FiUsers, FiDollarSign, FiDownload, FiSettings, FiHome, FiBell, 
  FiChevronLeft, FiChevronRight, FiMail, FiUserCheck, FiCreditCard,
  FiPieChart, FiLogOut, FiSun, FiMoon, FiMenu, FiX
} from 'react-icons/fi';
import { useAdminAuth } from '../../auth/AdminAuthProvider';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: FiUsers, label: 'User Management' },
    { path: '/admin/funds', icon: FiPieChart, label: 'Investment Funds' },
    { path: '/admin/deposits', icon: FiCreditCard, label: 'Deposits' },
    { path: '/admin/withdrawals', icon: FiDownload, label: 'Withdrawals' },
    { path: '/admin/announcements', icon: FiBell, label: 'Announcements' },
    { path: '/admin/support', icon: FiBell, label: 'Support Chat' },
    { path: '/admin/mirror', icon: FiUserCheck, label: 'Mirror User' },
    { path: '/admin/roi-approvals', icon: FiDollarSign, label: 'ROI Approvals' },
    { path: '/admin/send-email', icon: FiMail, label: 'Send Email' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`flex h-screen font-inter antialiased ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out animate-fade-in-left
        ${sidebarOpen ? 'w-72' : 'w-20'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${darkMode 
          ? 'bg-gradient-to-b from-slate-800/95 via-gray-800/95 to-slate-900/95 border-slate-700/50' 
          : 'bg-gradient-to-b from-white/95 via-gray-50/95 to-white/95 border-gray-200/50'
        }
        border-r backdrop-blur-xl shadow-2xl flex flex-col
      `}>
        
        {/* Header */}
        <div className={`
          flex items-center justify-between h-20 px-6 
          ${darkMode ? 'border-slate-700/50' : 'border-gray-200/50'} 
          border-b backdrop-blur-sm
        `}>
          <div className={`flex items-center transition-all duration-300 ${!sidebarOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-3 shadow-lg">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                LUXHEDGE
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Admin Panel
              </p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path, item.exact);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
                  animate-fade-in-up animate-stagger-${Math.min(index + 1, 5)} hover-lift button-press
                  ${isActive 
                    ? darkMode 
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-lg shadow-amber-500/10' 
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 shadow-lg shadow-amber-500/10'
                    : darkMode
                      ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <Icon className={`
                  ${sidebarOpen ? 'mr-3' : 'mx-auto'} 
                  text-lg transition-all duration-200
                  ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                `} />
                
                {sidebarOpen && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
                
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Controls */}
        <div className={`
          px-4 py-6 border-t ${darkMode ? 'border-slate-700/50' : 'border-gray-200/50'} 
          space-y-4
        `}>
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`
              w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200
              ${darkMode 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }
            `}
          >
            {darkMode ? <FiSun className="mr-3" /> : <FiMoon className="mr-3" />}
            {sidebarOpen && (
              <span className="font-medium">
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Admin Profile */}
          <div className={`
            flex items-center p-4 rounded-xl
            ${darkMode 
              ? 'bg-gradient-to-r from-slate-700/50 to-slate-600/50' 
              : 'bg-gradient-to-r from-gray-100 to-gray-50'
            }
          `}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            
            {sidebarOpen && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {admin?.name || 'Administrator'}
                </p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Admin Access
                </p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`
              w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200
              animate-fade-in-up animate-stagger-5 hover-lift button-press
              ${darkMode 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              }
            `}
          >
            <FiLogOut className={`${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`
            fixed top-6 left-6 z-40 p-3 rounded-xl shadow-lg transition-all duration-200
            ${darkMode 
              ? 'bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700/50' 
              : 'bg-white/90 hover:bg-gray-50/90 text-gray-900 border border-gray-200/50'
            }
            backdrop-blur-sm
          `}
        >
          <FiMenu size={20} />
        </button>
      )}

      {/* Sidebar Toggle (Desktop) */}
      {!isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`
            fixed top-6 z-40 p-2 rounded-lg transition-all duration-200
            ${sidebarOpen ? 'left-64' : 'left-6'}
            ${darkMode 
              ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700/50' 
              : 'bg-white/90 hover:bg-gray-50/90 text-gray-600 border border-gray-200/50'
            }
            backdrop-blur-sm shadow-lg
          `}
        >
          {sidebarOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
        </button>
      )}

      {/* Main Content */}
      <main className={`
        flex-1 transition-all duration-300 overflow-hidden
        ${!isMobile && sidebarOpen ? 'ml-72' : !isMobile ? 'ml-20' : 'ml-0'}
      `}>
        <div className={`
          h-full overflow-y-auto
          ${darkMode 
            ? 'bg-gradient-to-br from-slate-900/50 via-gray-900/50 to-slate-800/50' 
            : 'bg-gradient-to-br from-gray-50/50 via-white/50 to-gray-100/50'
          }
        `}>
          <div className="min-h-full p-6 md:p-8 lg:p-12 animate-fade-in">
            <div className="max-w-7xl mx-auto animate-fade-in-up">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;