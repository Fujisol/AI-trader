import React from 'react';
import { CogIcon, ShieldCheckIcon, BoltIcon as LightningBoltIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  return (
    <div className="settings">
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your AI trading bot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center space-x-3 mb-6">
            <CogIcon className="w-8 h-8 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Trading Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Trading Mode</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
                <option value="paper">Paper Trading</option>
                <option value="live">Live Trading</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Max Position Size ($)</label>
              <input 
                type="number" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Risk Percentage (%)</label>
              <input 
                type="number" 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheckIcon className="w-8 h-8 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Enhanced AI Features</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-white">Token Discovery</span>
              <span className="text-green-400 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-white">High-Performance Traders</span>
              <span className="text-blue-400 font-medium">Scanning</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-white">Copy Trading</span>
              <span className="text-purple-400 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <span className="text-white">Social Intelligence</span>
              <span className="text-yellow-400 font-medium">Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default Settings;
