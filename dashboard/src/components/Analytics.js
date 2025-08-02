import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Analytics = () => {
  return (
    <div className="analytics">
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Advanced trading metrics and insights</p>
      </div>

      <div className="dashboard-card text-center py-16">
        <ChartBarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
        <p className="text-gray-400">Detailed performance metrics coming soon</p>
      </div>
    </div>
  );
};

export default Analytics;
