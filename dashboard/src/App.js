import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TokenDiscovery from './components/TokenDiscovery';
import TraderAnalysis from './components/TraderAnalysis';
import Portfolio from './components/Portfolio';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [botStatus, setBotStatus] = useState('stopped');
  const [portfolioData, setPortfolioData] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Fetch initial data
    fetchBotStatus();
    fetchPortfolioData();
    
    // Set up real-time updates
    const statusInterval = setInterval(fetchBotStatus, 5000);
    const portfolioInterval = setInterval(fetchPortfolioData, 10000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(portfolioInterval);
    };
  }, []);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/status');
      const data = await response.json();
      setBotStatus(data.isRunning ? 'running' : 'stopped');
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
      setBotStatus('error');
    }
  };

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/trading/analytics');
      const data = await response.json();
      setPortfolioData(data);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard portfolioData={portfolioData} botStatus={botStatus} />;
      case 'discovery':
        return <TokenDiscovery />;
      case 'traders':
        return <TraderAnalysis />;
      case 'portfolio':
        return <Portfolio portfolioData={portfolioData} />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard portfolioData={portfolioData} botStatus={botStatus} />;
    }
  };

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} botStatus={botStatus} />
      <div className="main-content">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
