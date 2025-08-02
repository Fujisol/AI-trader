import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [botStatus, setBotStatus] = useState('stopped');
  const [portfolioData, setPortfolioData] = useState(null);
  const [tradingHistory, setTradingHistory] = useState([]);
  const [currentPositions, setCurrentPositions] = useState([]);
  const [realTimePnL, setRealTimePnL] = useState(null);
  const [copyTradingStats, setCopyTradingStats] = useState(null);
  const [tradingAnalytics, setTradingAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8080');
    setSocket(ws);

    ws.onopen = () => {
      console.log('Connected to trading bot');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status') {
        setBotStatus(data.status);
      } else if (data.type === 'alert') {
        setAlerts(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 alerts
      } else if (data.type === 'trade') {
        // Refresh data on new trades
        fetchAllData();
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from trading bot');
    };

    // Initial data fetch
    fetchAllData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchAllData, 5000); // Update every 5 seconds

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all data in parallel
      const [
        portfolioRes,
        historyRes,
        positionsRes,
        pnlRes,
        copyStatsRes,
        analyticsRes
      ] = await Promise.all([
        fetch('http://localhost:8080/api/portfolio/performance'),
        fetch('http://localhost:8080/api/trading/history'),
        fetch('http://localhost:8080/api/trading/positions'),
        fetch('http://localhost:8080/api/trading/pnl'),
        fetch('http://localhost:8080/api/copy-trading/stats'),
        fetch('http://localhost:8080/api/trading/analytics')
      ]);

      const [portfolio, history, positions, pnl, copyStats, analytics] = await Promise.all([
        portfolioRes.json(),
        historyRes.json(),
        positionsRes.json(),
        pnlRes.json(),
        copyStatsRes.json(),
        analyticsRes.json()
      ]);

      setPortfolioData(portfolio);
      setTradingHistory(history.trades || []);
      setCurrentPositions(positions.positions || []);
      setRealTimePnL(pnl);
      setCopyTradingStats(copyStats);
      setTradingAnalytics(analytics);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const startBot = async () => {
    try {
      await fetch('http://localhost:8080/api/start', { method: 'POST' });
      setBotStatus('running');
    } catch (error) {
      console.error('Failed to start bot:', error);
    }
  };

  const stopBot = async () => {
    try {
      await fetch('http://localhost:8080/api/stop', { method: 'POST' });
      setBotStatus('stopped');
    } catch (error) {
      console.error('Failed to stop bot:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🤖 AI Crypto Trading Bot</h1>
        <div className="status">
          <span className={`status-indicator ${botStatus}`}></span>
          <span>Status: {botStatus.toUpperCase()}</span>
          <button 
            onClick={botStatus === 'running' ? stopBot : startBot}
            className={`btn ${botStatus === 'running' ? 'btn-danger' : 'btn-success'}`}
          >
            {botStatus === 'running' ? 'Stop' : 'Start'} Bot
          </button>
        </div>
      </header>

      <main className="main">
        {/* Portfolio Overview */}
        <section className="portfolio-overview">
          <h2>📊 Portfolio Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Portfolio Value</h3>
              <div className="stat-value">{formatCurrency(realTimePnL?.totalPortfolioUSD)}</div>
            </div>
            <div className="stat-card">
              <h3>Total P&L</h3>
              <div className={`stat-value ${(realTimePnL?.totalPnL || 0) >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(realTimePnL?.totalPnL)} ({formatPercent(realTimePnL?.totalPnLPercent)})
              </div>
            </div>
            <div className="stat-card">
              <h3>SOL Balance</h3>
              <div className="stat-value">{(realTimePnL?.solBalance || 0).toFixed(4)} SOL</div>
            </div>
            <div className="stat-card">
              <h3>Active Trades</h3>
              <div className="stat-value">{realTimePnL?.activeTrades || 0}</div>
            </div>
          </div>
        </section>

        {/* Copy Trading Stats */}
        <section className="copy-trading-stats">
          <h2>🔄 Copy Trading Performance</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Success Rate</h3>
              <div className="stat-value">{formatPercent(tradingAnalytics?.performance?.successRate)}</div>
            </div>
            <div className="stat-card">
              <h3>Total Trades</h3>
              <div className="stat-value">{copyTradingStats?.totalCopiedTrades || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Tracked Traders</h3>
              <div className="stat-value">{copyTradingStats?.trackedTraders || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Avg Trade Size</h3>
              <div className="stat-value">{formatCurrency(tradingAnalytics?.performance?.averageTradeSize)}</div>
            </div>
          </div>
        </section>

        {/* Current Positions */}
        <section className="current-positions">
          <h2>💎 Current Positions</h2>
          <div className="table-container">
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Balance</th>
                  <th>Current Price</th>
                  <th>Purchase Price</th>
                  <th>Current Value</th>
                  <th>P&L</th>
                  <th>P&L %</th>
                </tr>
              </thead>
              <tbody>
                {currentPositions.map((position, index) => (
                  <tr key={index}>
                    <td className="token-name">{position.symbol}</td>
                    <td>{position.balance.toLocaleString()}</td>
                    <td>${position.currentPrice.toFixed(6)}</td>
                    <td>${position.purchasePrice.toFixed(6)}</td>
                    <td>{formatCurrency(position.currentValueUSD)}</td>
                    <td className={position.pnlUSD >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(position.pnlUSD)}
                    </td>
                    <td className={position.pnlPercent >= 0 ? 'positive' : 'negative'}>
                      {formatPercent(position.pnlPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trading History */}
        <section className="trading-history">
          <h2>📈 Recent Trades</h2>
          <div className="table-container">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Token</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>USD Value</th>
                  <th>Trader</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tradingHistory.slice(0, 20).map((trade, index) => (
                  <tr key={index}>
                    <td>{formatTime(trade.timestamp)}</td>
                    <td className={`trade-type ${trade.type.toLowerCase()}`}>{trade.type}</td>
                    <td className="token-name">{trade.token}</td>
                    <td>{trade.amount?.toFixed(2) || 'N/A'}</td>
                    <td>${trade.price?.toFixed(6) || 'N/A'}</td>
                    <td>{formatCurrency(trade.usdValue)}</td>
                    <td className="trader-name">{trade.trader?.slice(0, 10)}...</td>
                    <td className={`status ${trade.status.toLowerCase()}`}>{trade.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Alerts */}
        <section className="alerts">
          <h2>🚨 Live Alerts</h2>
          <div className="alerts-container">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.type}`}>
                <span className="alert-time">{formatTime(alert.timestamp)}</span>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="no-alerts">No recent alerts</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
