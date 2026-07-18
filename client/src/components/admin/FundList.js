// src/components/admin/FundList.js
import React from 'react';
import { FiEdit2, FiTrendingUp, FiClock } from 'react-icons/fi';

const FundList = ({ funds, onEdit }) => {
  if (funds.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">No funds found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="hidden md:block overflow-x-auto rounded-xl">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 text-left">
            <th className="p-4">Fund</th>
            <th className="p-4">Strategy</th>
            <th className="p-4">ROI Range</th>
            <th className="p-4">Lock Periods</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund) => (
            <tr key={fund.id} className="border-b border-gray-700 hover:bg-gray-700">
              <td className="p-4">
                <div className="font-medium">{fund.name}</div>
                <div className="text-sm text-gray-400">{fund.description}</div>
              </td>
              <td className="p-4">
                <span className="capitalize">{fund.strategy.replace('_', ' ')}</span>
              </td>
              <td className="p-4">
                <div className="flex items-center text-gold">
                  <FiTrendingUp className="mr-2" />
                  {fund.roiRange.min}% - {fund.roiRange.max}%
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center">
                  <FiClock className="mr-2 text-gray-400" />
                  {fund.lockPeriods.join(', ')} days
                </div>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  fund.status === 'active' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                  fund.status === 'paused' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                  'bg-gray-600'
                }`}>
                  {fund.status}
                </span>
              </td>
              <td className="p-4">
                <button
                  onClick={() => onEdit(fund)}
                  className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  <FiEdit2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-3 p-3">
        {funds.map(fund => (
          <div key={fund.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <div className="font-semibold truncate">{fund.name}</div>
                <div className="text-xs text-gray-400 truncate">{fund.description}</div>
                <div className="text-xs text-gray-400 mt-1">Strategy: {fund.strategy.replace('_',' ')}</div>
              </div>
              <div className="text-right ml-3">
                <div className="text-gold font-mono">{fund.roiRange.min}% - {fund.roiRange.max}%</div>
                <div className="text-xs text-gray-400 mt-1">{fund.lockPeriods.join(', ')} days</div>
                <div className={`mt-1 px-2 py-0.5 rounded-full text-xs ${fund.status === 'active' ? 'bg-green-500 bg-opacity-20 text-green-400' : fund.status === 'paused' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' : 'bg-gray-600'}`}>{fund.status}</div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => onEdit(fund)} className="px-3 py-2 bg-gray-700 rounded-lg">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundList;
