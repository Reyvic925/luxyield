// src/components/admin/FundPerformanceChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FundPerformanceChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="var(--text-tertiary)" />
        <YAxis stroke="var(--text-tertiary)" unit="%" />
        <Tooltip 
          contentClassName="chart-tooltip"
          formatter={(value) => [`${value}%`, 'ROI']}
          labelStyle={{ color: 'inherit' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="roi"
          stroke="#D4AF37"
          strokeWidth={2}
          dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Monthly ROI"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default FundPerformanceChart;
