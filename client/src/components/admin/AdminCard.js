import React from 'react';

const AdminCard = ({ title, value, icon, change }) => (
  <div className="bg-gray-800 p-6 rounded-xl flex flex-col hover:bg-gray-700 transition-colors duration-200">
    <div className="flex items-center justify-between">
      <div className="text-gray-400 text-sm font-medium">{title}</div>
      <div className="text-2xl text-gold">{icon}</div>
    </div>
    <div className="mt-2">
      <div className="text-2xl font-bold text-gray-100">{value}</div>
      {change && (
        <div className="text-sm mt-1">
          <span className={`inline-flex items-center ${change.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
            {change}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default AdminCard;
