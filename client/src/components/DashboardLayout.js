// src/components/DashboardLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopRightBar from './TopRightBar';
import { FiMenu } from 'react-icons/fi';

const DashboardLayout = ({ sidebarCollapsed, setSidebarCollapsed, hasNewAnnouncement }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header row: contains logo / nav and top-right controls */}
      <header className="w-full flex items-center justify-between px-4 py-3 border-b theme-aware-border-secondary" style={{ background: 'linear-gradient(90deg, rgba(166,124,0,0.06), rgba(255,217,99,0.02))' }}>
        <div className="flex items-center gap-4">
          {/* Hamburger for mobile to open sidebar overlay */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-gold text-black"
            aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <FiMenu />
          </button>
          <a href="/" className="flex items-center gap-3">
            <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="LuxYield" className="h-8 md:h-10 w-auto rounded-sm drop-shadow-sm" />
            <span className="text-lg md:text-xl font-extrabold bg-clip-text text-transparent" style={{ background: 'linear-gradient(90deg, #D4AF37, #FFD963)' }}>
              LuxYield
            </span>
          </a>
        </div>

        <div className="ml-auto">
          <TopRightBar />
        </div>
      </header>

      {/* Main area: sidebar column + content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          hasNewAnnouncement={hasNewAnnouncement}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-screen-lg mx-auto p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
