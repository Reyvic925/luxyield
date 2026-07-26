// src/components/FundDetails.js
import React from 'react';
import { FiBarChart2, FiClock, FiDollarSign, FiShield, FiInfo } from 'react-icons/fi';

const FundDetails = ({ fund }) => {
  const details = [
    { icon: <FiBarChart2 />, label: 'Strategy', value: fund.strategy || 'Long-term growth' },
    { icon: <FiClock />, label: 'Avg. Duration', value: fund.avgDuration || '12-24 months' },
    { icon: <FiDollarSign />, label: 'Min. Investment', value: `$${fund.plans[0].min}` },
    { icon: <FiShield />, label: 'Risk Level', value: fund.riskLevel || 'Medium' },
  ];

  return (
    <div className="glassmorphic p-6 rounded-xl mb-6">
      <h3 className="text-xl font-bold mb-4 flex items-center text-black dark:text-white">
        <FiInfo className="mr-2" /> Fund Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="text-gold mr-3">{item.icon}</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
              <p className="font-medium text-black dark:text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      {fund.notes && (
        <div className="mt-4 p-3 bg-gray-200 dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">{fund.notes}</p>
        </div>
      )}
    </div>
  );
};

export default FundDetails;
