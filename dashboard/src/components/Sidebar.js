import React from 'react';
import { 
  HomeIcon, 
  MagnifyingGlassIcon as SearchIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  BoltIcon as LightningBoltIcon,
  TrendingUpIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ currentPage, setCurrentPage, botStatus }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'discovery', label: 'Token Discovery', icon: SearchIcon },
    { id: 'traders', label: 'Top Traders', icon: UsersIcon },
    { id: 'portfolio', label: 'Portfolio', icon: CurrencyDollarIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ];

  const getStatusColor = () => {
    switch (botStatus) {
      case 'running': return 'text-green-400';
      case 'stopped': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (botStatus) {
      case 'running': return 'Running';
      case 'stopped': return 'Stopped';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <LightningBoltIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Trader</h1>
            <p className="text-xs text-gray-400">Enhanced Bot</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`}></div>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUpIcon className="w-5 h-5 text-white" />
            <div>
              <p className="text-sm font-medium text-white">Enhanced AI</p>
              <p className="text-xs text-blue-100">Multi-source discovery</p>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">Paper Trading Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
