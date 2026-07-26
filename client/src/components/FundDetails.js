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
      <h3 className="text-xl font-bold mb-4 flex items-center theme-aware-text">
        <FiInfo className="mr-2" /> Fund Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="text-gold mr-3">{item.icon}</span>
            <div>
              <p className="text-sm theme-aware-text-secondary">{item.label}</p>
              <p className="font-medium theme-aware-text">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      {fund.notes && (
        <div className="mt-4 p-3 theme-aware-bg-secondary bg-opacity-50 rounded-lg">
          <p className="text-sm theme-aware-text-secondary">{fund.notes}</p>
        </div>
      )}
    </div>
  );
};

export default FundDetails;
