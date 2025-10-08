// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiDollarSign, FiDownload, FiActivity,
  FiMessageSquare, FiPieChart, FiBell, FiCpu
} from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { getAdminStats } from '../../services/adminStatsAPI';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '...', icon: <FiUsers />, change: '' },
    { title: 'Active Investments', value: '...', icon: <FiDollarSign />, change: '' },
    { title: 'Pending Withdrawals', value: '...', icon: <FiDownload />, change: '' },
    { title: "Today's ROI", value: '...', icon: <FiActivity />, change: '' }
  ]);

  useEffect(() => {
    getAdminStats().then(data => {
      setStats([
        { title: 'Total Users', value: data.totalUsers, icon: <FiUsers />, change: '' },
        { title: 'Active Investments', value: data.totalInvestments, icon: <FiDollarSign />, change: '' },
        { title: 'Pending Withdrawals', value: data.totalWithdrawals, icon: <FiDownload />, change: '' },
        { title: "Today's ROI", value: data.todayROI + '%', icon: <FiActivity />, change: '' }
      ]);
    });
  }, []);

  const actions = (
    <>
      <Link
        to="/admin/users"
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <FiUsers className="text-gold" />
        <span>New User</span>
      </Link>
      <Link
        to="/admin/announcements"
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <FiBell className="text-gold" />
        <span>New Announcement</span>
      </Link>
    </>
  );

  return (
    <AdminPageLayout title="Dashboard" actions={actions}>
      <div className="p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <AdminCard 
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-100">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/admin/funds" className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group">
                <FiPieChart className="text-2xl text-gold mb-2" />
                <h3 className="font-medium text-gray-100">Manage Funds</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300">View and manage investment funds</p>
              </Link>
              <Link to="/admin/support" className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group">
                <FiMessageSquare className="text-2xl text-gold mb-2" />
                <h3 className="font-medium text-gray-100">Support Chat</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300">Respond to user inquiries</p>
              </Link>
              <Link to="/admin/withdrawals" className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group">
                <FiDownload className="text-2xl text-gold mb-2" />
                <h3 className="font-medium text-gray-100">Withdrawals</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300">Process withdrawal requests</p>
              </Link>
              <Link to="/admin/mirror" className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group">
                <FiCpu className="text-2xl text-gold mb-2" />
                <h3 className="font-medium text-gray-100">Mirror User</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300">Debug user accounts</p>
              </Link>
            </div>
          </div>

          {/* Recent Activity and Support Section */}
          <div className="space-y-6">
            <div className="bg-gray-700/50 backdrop-blur rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-100">Recent Activity</h2>
              <div className="space-y-4">
                <div className="text-gray-400 text-sm">Loading recent activities...</div>
              </div>
            </div>

            {/* Support Chat Panel */}
            <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 rounded-xl p-6 border border-yellow-500/20">
              <h2 className="text-xl font-bold mb-4 text-gold flex items-center gap-2">
                Support Chat <span className="text-sm font-normal text-gray-400">(Admin)</span>
              </h2>
              <p className="mb-4 text-gray-300">View and reply to user support messages in real time.</p>
              <Link 
                to="/admin/support" 
                className="inline-flex items-center px-6 py-2 rounded-lg bg-gold text-black font-semibold hover:bg-yellow-500 transition-colors"
              >
                <FiMessageSquare className="mr-2" />
                Open Support Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;
      </div>
    </div>
  );
};

export default AdminDashboard;