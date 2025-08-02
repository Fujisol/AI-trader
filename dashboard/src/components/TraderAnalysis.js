import React, { useState, useEffect } from 'react';
import { UsersIcon, TrendingUpIcon, StarIcon } from '@heroicons/react/24/outline';

const TraderAnalysis = () => {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraders();
    const interval = setInterval(fetchTraders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTraders = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/discovery/traders');
      const data = await response.json();
      setTraders(data.data?.traders || []);
    } catch (error) {
      console.error('Failed to fetch traders:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockTraders = [
    {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      winRate: 0.94,
      trades3Months: 187,
      totalPnL: 156780,
      lastActive: Date.now() - 30000,
      favoriteTokens: ['SOL', 'USDC', 'JUP'],
      avgTradeSize: 2500
    },
    {
      address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC7LZ7WVQnMZtG',
      winRate: 0.89,
      trades3Months: 234,
      totalPnL: 89450,
      lastActive: Date.now() - 120000,
      favoriteTokens: ['BONK', 'WIF', 'PEPE'],
      avgTradeSize: 1800
    },
    {
      address: 'FKs4JH3Xc8qP9Ys7xZv2nR4dS6gT8uW3pLnBxVc9AzE2',
      winRate: 0.87,
      trades3Months: 156,
      totalPnL: 67230,
      lastActive: Date.now() - 300000,
      favoriteTokens: ['USDT', 'SOL', 'RAY'],
      avgTradeSize: 3200
    }
  ];

  const tradersToShow = traders.length > 0 ? traders : mockTraders;

  const formatTimeAgo = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="trader-analysis">
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold text-white">High-Performance Traders</h1>
        <p className="text-gray-400 mt-1">Elite traders with 80%+ win rates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <UsersIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">{tradersToShow.length} Elite Traders</h3>
              <p className="text-gray-400 text-sm">80%+ win rate</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <TrendingUpIcon className="w-8 h-8 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {tradersToShow.length > 0 ? (tradersToShow.reduce((sum, t) => sum + t.winRate, 0) / tradersToShow.length * 100).toFixed(1) : '0'}%
              </h3>
              <p className="text-gray-400 text-sm">Avg win rate</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <StarIcon className="w-8 h-8 text-yellow-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Active Monitoring</h3>
              <p className="text-gray-400 text-sm">Copy trading ready</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-card text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing trader performance...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tradersToShow.map((trader, index) => (
            <div key={index} className="dashboard-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {trader.address.slice(0, 8)}...{trader.address.slice(-8)}
                    </h3>
                    <p className="text-gray-400">Elite Trader</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-green-400">
                      {(trader.winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm">3M Trades</p>
                  <p className="text-white font-semibold">{trader.trades3Months}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total P&L</p>
                  <p className="text-green-400 font-semibold">${trader.totalPnL.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg Trade Size</p>
                  <p className="text-white font-semibold">${trader.avgTradeSize?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Last Active</p>
                  <p className="text-white font-semibold">{formatTimeAgo(trader.lastActive)}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Performance Score</p>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${trader.winRate * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Favorite Tokens</p>
                <div className="flex flex-wrap gap-2">
                  {(trader.favoriteTokens || ['SOL', 'USDC']).map((token, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                      {token}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                  Enable Copy Trading
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TraderAnalysis;
