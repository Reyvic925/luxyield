// src/pages/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiDollarSign, FiTrendingUp, FiDownload, FiActivity, 
  FiMessageSquare, FiArrowUpRight, FiArrowDownRight, FiClock,
  FiCheckCircle, FiAlertCircle, FiBarChart3, FiPieChart
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, change, trend, color = 'amber' }) => {
  const colorClasses = {
    amber: 'from-amber-400 to-orange-500',
    blue: 'from-blue-400 to-cyan-500',
    green: 'from-green-400 to-emerald-500',
    purple: 'from-purple-400 to-pink-500',
    red: 'from-red-400 to-rose-500'
  };

  return (
    <div className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-3">{value}</p>
          {change && (
            <div className="flex items-center space-x-2">
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                trend === 'up' 
                  ? 'bg-green-500/20 text-green-400' 
                  : trend === 'down'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {trend === 'up' && <FiArrowUpRight className="w-3 h-3 mr-1" />}
                {trend === 'down' && <FiArrowDownRight className="w-3 h-3 mr-1" />}
                {change}
              </div>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    </div>
  );
};

const QuickActionCard = ({ title, description, icon, link, color = 'amber' }) => {
  const colorClasses = {
    amber: 'from-amber-400 to-orange-500',
    blue: 'from-blue-400 to-cyan-500',
    green: 'from-green-400 to-emerald-500',
    purple: 'from-purple-400 to-pink-500'
  };

  return (
    <Link to={link} className="group block">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up card-hover button-press">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
          <FiArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
        </div>
      </div>
    </Link>
  );
};

const ActivityItem = ({ type, user, amount, time, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit': return <FiArrowDownRight className="w-4 h-4 text-green-400" />;
      case 'withdrawal': return <FiArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'investment': return <FiTrendingUp className="w-4 h-4 text-blue-400" />;
      default: return <FiActivity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0 animate-fade-in-left hover-lift smooth-transition">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {getTypeIcon(type)}
        </div>
        <div>
          <p className="text-white font-medium">{user}</p>
          <p className="text-gray-400 text-sm capitalize">{type} • {time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white font-semibold">{amount}</p>
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '1,234', icon: <FiUsers className="w-6 h-6" />, change: '+12.5%', trend: 'up', color: 'blue' },
    { title: 'Total Investments', value: '$2.4M', icon: <FiDollarSign className="w-6 h-6" />, change: '+8.2%', trend: 'up', color: 'green' },
    { title: 'Today\'s ROI', value: '2.4%', icon: <FiTrendingUp className="w-6 h-6" />, change: '+0.2%', trend: 'up', color: 'amber' },
    { title: 'Pending Withdrawals', value: '23', icon: <FiDownload className="w-6 h-6" />, change: '-5.1%', trend: 'down', color: 'purple' },
  ]);

  const quickActions = [
    {
      title: 'User Management',
      description: 'View and manage user accounts, KYC status, and balances',
      icon: <FiUsers className="w-6 h-6" />,
      link: '/admin/users',
      color: 'blue'
    },
    {
      title: 'Support Chat',
      description: 'Respond to user inquiries and support tickets',
      icon: <FiMessageSquare className="w-6 h-6" />,
      link: '/admin/support',
      color: 'green'
    },
    {
      title: 'ROI Approvals',
      description: 'Review and approve pending ROI distributions',
      icon: <FiCheckCircle className="w-6 h-6" />,
      link: '/admin/roi-approvals',
      color: 'amber'
    },
    {
      title: 'Analytics',
      description: 'View detailed platform analytics and reports',
      icon: <FiBarChart3 className="w-6 h-6" />,
      link: '/admin/analytics',
      color: 'purple'
    }
  ];

  const recentActivity = [
    { type: 'deposit', user: 'John Doe', amount: '$5,000', time: '2 min ago', status: 'completed' },
    { type: 'withdrawal', user: 'Jane Smith', amount: '$2,500', time: '15 min ago', status: 'pending' },
    { type: 'investment', user: 'Mike Johnson', amount: '$10,000', time: '1 hour ago', status: 'completed' },
    { type: 'deposit', user: 'Sarah Wilson', amount: '$3,200', time: '2 hours ago', status: 'completed' },
    { type: 'withdrawal', user: 'David Brown', amount: '$1,800', time: '3 hours ago', status: 'failed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between animate-fade-in-down">
        <div className="animate-fade-in-left">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-gray-400 text-lg">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0 animate-fade-in-right">
          <div className="flex items-center space-x-2 text-gray-400">
            <FiClock className="w-4 h-4" />
            <span className="text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`animate-stagger-${Math.min(index + 1, 5)}`}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              trend={stat.trend}
              color={stat.color}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              link={action.link}
              color={action.color}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Link 
                to="/admin/activity" 
                className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors duration-200"
              >
                View All
              </Link>
            </div>
            <div className="space-y-0">
              {recentActivity.map((activity, index) => (
                <ActivityItem
                  key={index}
                  type={activity.type}
                  user={activity.user}
                  amount={activity.amount}
                  time={activity.time}
                  status={activity.status}
                />
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          {/* Platform Health */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Server Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-green-400 text-sm">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Payment Gateway</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-yellow-400 text-sm">Maintenance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">High withdrawal volume</p>
                  <p className="text-gray-400 text-xs">23 pending withdrawals require review</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiCheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Backup completed</p>
                  <p className="text-gray-400 text-xs">Daily backup finished successfully</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;