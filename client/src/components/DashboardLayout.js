// src/components/DashboardLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../hooks/useTheme';
import { FiMenu } from 'react-icons/fi';

const DashboardLayout = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { isDark } = useTheme();

  return (
    <div 
      className="flex flex-col md:flex-row h-screen"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div 
        className="flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-gold"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Main content area with theme-aware scrollbar track */}
        <div className="flex-1 flex justify-center items-start">
          <div className="w-full max-w-screen-lg mx-auto p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
