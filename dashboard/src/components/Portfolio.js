import React from 'react';
import { CurrencyDollarIcon, TrendingUpIcon } from '@heroicons/react/24/outline';

const Portfolio = ({ portfolioData }) => {
  const tokens = portfolioData?.portfolio?.tokenDistribution || {};
  const topPerformers = portfolioData?.portfolio?.topPerformers || [];

  return (
    <div className="portfolio">
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <p className="text-gray-400 mt-1">Your trading positions and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">
                ${portfolioData?.portfolio?.totalValue?.toLocaleString() || '0'}
              </h3>
              <p className="text-gray-400">Total Value</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <TrendingUpIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-2xl font-bold text-green-400">+15.2%</h3>
              <p className="text-gray-400">24h Change</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">{Object.keys(tokens).length}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{Object.keys(tokens).length}</h3>
              <p className="text-gray-400">Active Positions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-white mb-4">Token Holdings</h3>
          <div className="space-y-4">
            {Object.entries(tokens).map(([symbol, data]) => (
              <div key={symbol} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{symbol}</h4>
                    <p className="text-gray-400 text-sm">{data.balance?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">${data.valueUSD?.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{data.percentage?.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{performer.symbol?.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{performer.symbol}</h4>
                    <p className="text-gray-400 text-sm">${performer.currentValue?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-400">+{performer.pnlPercent?.toFixed(1)}%</p>
                  <p className="text-gray-400 text-sm">P&L</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
