import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  EyeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  BoltIcon as LightningBoltIcon,
  ChartBarIcon,
  MagnifyingGlassIcon as SearchIcon
} from '@heroicons/react/24/outline';

const Dashboard = ({ portfolioData, botStatus }) => {
  const [recentTrades, setRecentTrades] = useState([]);
  const [discoveredTokens, setDiscoveredTokens] = useState([]);
  const [topTraders, setTopTraders] = useState([]);
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    fetchRecentData();
    const interval = setInterval(fetchRecentData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentData = async () => {
    try {
      const [tradesRes, tokensRes, tradersRes, signalsRes] = await Promise.all([
        fetch('http://localhost:8080/api/trading/history'),
        fetch('http://localhost:8080/api/discovery/tokens'),
        fetch('http://localhost:8080/api/discovery/traders'),
        fetch('http://localhost:8080/api/signals/advanced')
      ]);

      const trades = await tradesRes.json();
      const tokens = await tokensRes.json();
      const traders = await tradersRes.json();
      const signalsData = await signalsRes.json();

      setRecentTrades(trades.slice(-5) || []);
      setDiscoveredTokens(tokens.data?.tokens?.slice(0, 3) || []);
      setTopTraders(traders.data?.traders?.slice(0, 3) || []);
      setSignals(signalsData.data || {});
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  // Sample chart data
  const portfolioHistory = [
    { time: '00:00', value: 35000 },
    { time: '04:00', value: 35200 },
    { time: '08:00', value: 35100 },
    { time: '12:00', value: 35328 },
    { time: '16:00', value: 35400 },
    { time: '20:00', value: 35328 }
  ];

  const tokenDistribution = portfolioData?.portfolio?.tokenDistribution ? 
    Object.entries(portfolioData.portfolio.tokenDistribution).map(([token, data]) => ({
      name: token,
      value: data.percentage,
      amount: data.valueUSD
    })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const StatsCard = ({ title, value, change, icon: Icon, color = "blue" }) => (
    <div className="stats-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
              <span className="text-sm">{Math.abs(change).toFixed(2)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-600 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold text-white">Enhanced AI Trading Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time monitoring and advanced discovery</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Portfolio Value"
          value={`$${portfolioData?.portfolio?.totalValue?.toLocaleString() || '0'}`}
          change={5.2}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatsCard
          title="Active Positions"
          value={Object.keys(portfolioData?.portfolio?.tokenDistribution || {}).length}
          icon={ChartBarIcon}
          color="blue"
        />
        <StatsCard
          title="Discovered Tokens"
          value={discoveredTokens.length}
          icon={SearchIcon}
          color="purple"
        />
        <StatsCard
          title="Top Traders"
          value={topTraders.length}
          icon={UsersIcon}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Performance Chart */}
        <div className="lg:col-span-2 dashboard-card">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={portfolioHistory}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#0088FE" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Token Distribution */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-white mb-4">Token Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tokenDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
              >
                {tokenDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discovered Tokens */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Latest Token Discoveries</h3>
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {discoveredTokens.length > 0 ? discoveredTokens.map((token, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">{token.symbol || token.token}</p>
                  <p className="text-sm text-gray-400">{token.name || 'New Token'}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">{((token.potentialScore || 0) * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Potential Score</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Scanning for new tokens...</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Traders */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">High-Performance Traders</h3>
            <UsersIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topTraders.length > 0 ? topTraders.map((trader, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">{trader.address}</p>
                  <p className="text-sm text-gray-400">{trader.trades3Months} trades (3M)</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">{(trader.winRate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Win Rate</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Discovering top traders...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 dashboard-card">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <LightningBoltIcon className="w-5 h-5 text-blue-400" />
            <span className="text-white">Enhanced AI system actively monitoring markets</span>
            <span className="text-gray-400 text-sm ml-auto">Live</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <EyeIcon className="w-5 h-5 text-green-400" />
            <span className="text-white">Scanning Birdeye, Jupiter, DexScreener for opportunities</span>
            <span className="text-gray-400 text-sm ml-auto">Active</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <UsersIcon className="w-5 h-5 text-purple-400" />
            <span className="text-white">Analyzing high-performance trader patterns</span>
            <span className="text-gray-400 text-sm ml-auto">Running</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
