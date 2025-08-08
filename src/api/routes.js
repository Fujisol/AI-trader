const express = require('express');
const Logger = require('../utils/Logger');
const { apiKeyAuth } = require('../utils/authMiddleware');
const SupabaseProxy = require('../services/SupabaseProxy');

class APIRoutes {
  constructor(bot) {
    this.bot = bot;
    this.logger = new Logger('APIRoutes');
    this.router = express.Router();
    this.supabaseProxy = new SupabaseProxy();
    this.setupRoutes();
  }

  setupRoutes() {
    // Security middleware for mutating routes
    this.router.post('/start', apiKeyAuth, this.startBot.bind(this));
    this.router.post('/stop', apiKeyAuth, this.stopBot.bind(this));

    // Proxy (secured) endpoints to centralize Supabase writes
    this.router.post('/proxy/trades', apiKeyAuth, this.proxySaveTrade.bind(this));
    this.router.get('/proxy/trades', this.proxyGetTrades.bind(this));
    this.router.post('/proxy/users', apiKeyAuth, this.proxySaveUser.bind(this));
    this.router.get('/proxy/users/:email', this.proxyGetUser.bind(this)); // removed apiKeyAuth for read
    this.router.post('/proxy/settings', apiKeyAuth, this.proxySaveSettings.bind(this));
    this.router.get('/proxy/settings/:userId', this.proxyGetSettings.bind(this)); // removed apiKeyAuth for read

    // Trading controls
    this.router.post('/start', this.startBot.bind(this));
    this.router.post('/stop', this.stopBot.bind(this));
    this.router.get('/status', this.getStatus.bind(this));

    // Market data
    this.router.get('/market/opportunities', this.getOpportunities.bind(this));
    this.router.get('/market/analysis', this.getMarketAnalysis.bind(this));
    this.router.get('/social/sentiment', this.getSocialSentiment.bind(this));

    // Portfolio
    this.router.get('/portfolio/balance', this.getBalance.bind(this));
    this.router.get('/portfolio/positions', this.getPositions.bind(this));
    this.router.get('/portfolio/history', this.getTradingHistory.bind(this));
    this.router.get('/portfolio/performance', this.getPortfolioPerformance.bind(this));

    // Performance
    this.router.get('/performance/stats', this.getPerformanceStats.bind(this));
    this.router.get('/performance/daily', this.getDailyPerformance.bind(this));
    this.router.get('/performance/analysis', this.getPerformanceAnalysis.bind(this));

    // Risk management
    this.router.get('/risk/assessment', this.getRiskAssessment.bind(this));
    this.router.get('/risk/report', this.getRiskReport.bind(this));

    // Alerts
    this.router.get('/alerts', this.getAlerts.bind(this));
    this.router.delete('/alerts', this.clearAlerts.bind(this));

    // Copy trading
    this.router.get('/copy-trading/stats', this.getCopyTradingStats.bind(this));
    this.router.get('/copy-trading/traders', this.getTopTraders.bind(this));
    this.router.get('/copy-trading/trades', this.getCopyTradingTrades.bind(this));
    this.router.get('/copy-trading/history', this.getCopyTradingHistory.bind(this));

    // Trading history and analytics
    this.router.get('/trading/history', this.getTradingHistory.bind(this));
    this.router.get('/trading/positions', this.getCurrentPositions.bind(this));
    this.router.get('/trading/pnl', this.getRealTimePnL.bind(this));
    this.router.get('/trading/analytics', this.getTradingAnalytics.bind(this));

    // Enhanced discovery and intelligence
    this.router.get('/discovery/tokens', this.getDiscoveredTokens.bind(this));
    this.router.get('/discovery/traders', this.getHighPerformanceTraders.bind(this));
    this.router.get('/sentiment/:token', this.getTokenSentimentAnalysis.bind(this));
    this.router.get('/signals/advanced', this.getAdvancedSignals.bind(this));

    // Manual trading
    this.router.post('/trade/buy', this.manualBuy.bind(this));
    this.router.post('/trade/sell', this.manualSell.bind(this));
    this.router.post('/position/close', this.closePosition.bind(this));

    // Configuration
    this.router.get('/config', this.getConfig.bind(this));
    this.router.put('/config', this.updateConfig.bind(this));
  }

  async startBot(req, res) {
    try {
      if (this.bot.isRunning) {
        return res.status(400).json({ error: 'Bot is already running' });
      }

      await this.bot.start();
      await this.bot.alertSystem.systemAlert('Trading bot started', 'success');
      
      res.json({ 
        success: true, 
        message: 'Bot started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async stopBot(req, res) {
    try {
      if (!this.bot.isRunning) {
        return res.status(400).json({ error: 'Bot is not running' });
      }

      await this.bot.stop();
      await this.bot.alertSystem.systemAlert('Trading bot stopped', 'warning');
      
      res.json({ 
        success: true, 
        message: 'Bot stopped successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to stop bot:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getStatus(req, res) {
    try {
      const status = {
        isRunning: this.bot.isRunning,
        uptime: this.bot.isRunning ? Date.now() - this.bot.startTime : 0,
        walletBalance: this.bot.walletManager.getBalance(),
        activePositions: this.bot.tradingAgent.getActivePositions(),
        dailyPnL: this.bot.tradingAgent.getDailyPnL(),
        totalPnL: this.bot.tradingAgent.getTotalPnL(),
        lastUpdate: new Date().toISOString()
      };
      
      res.json(status);
    } catch (error) {
      this.logger.error('Failed to get status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getOpportunities(req, res) {
    try {
      const analysis = await this.bot.marketAgent.getAnalysis();
      res.json({
        opportunities: analysis.marketData.opportunities || [],
        count: analysis.marketData.opportunities?.length || 0,
        lastUpdate: analysis.timestamp
      });
    } catch (error) {
      this.logger.error('Failed to get opportunities:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMarketAnalysis(req, res) {
    try {
      const analysis = await this.bot.marketAgent.getAnalysis();
      res.json(analysis);
    } catch (error) {
      this.logger.error('Failed to get market analysis:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSocialSentiment(req, res) {
    try {
      const sentiment = await this.bot.socialAgent.getSentiment();
      res.json(sentiment);
    } catch (error) {
      this.logger.error('Failed to get social sentiment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getBalance(req, res) {
    try {
      await this.bot.walletManager.updateBalance();
      const balance = this.bot.walletManager.getBalance();
      const portfolioValue = this.bot.walletManager.getPortfolioValue();
      
      res.json({
        balance,
        portfolioValue,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get balance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPositions(req, res) {
    try {
      const positions = this.bot.tradingAgent.getActivePositions();
      res.json({
        positions,
        count: positions.length,
        totalValue: positions.reduce((sum, pos) => sum + pos.size, 0)
      });
    } catch (error) {
      this.logger.error('Failed to get positions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTradingHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = this.bot.tradingAgent.getTradingHistory().slice(-limit);
      
      res.json({
        trades: history,
        count: history.length
      });
    } catch (error) {
      this.logger.error('Failed to get trading history:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPerformanceStats(req, res) {
    try {
      const stats = await this.bot.database.getPerformanceStats();
      res.json(stats);
    } catch (error) {
      this.logger.error('Failed to get performance stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getDailyPerformance(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const dailyPnL = await this.bot.database.getDailyPnL(days);
      
      res.json({
        dailyPnL,
        period: days
      });
    } catch (error) {
      this.logger.error('Failed to get daily performance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAlerts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const type = req.query.type;
      
      let alerts;
      if (type) {
        alerts = this.bot.alertSystem.getAlertsByType(type, limit);
      } else {
        alerts = this.bot.alertSystem.getRecentAlerts(limit);
      }
      
      res.json({
        alerts,
        stats: this.bot.alertSystem.getAlertStats()
      });
    } catch (error) {
      this.logger.error('Failed to get alerts:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async clearAlerts(req, res) {
    try {
      this.bot.alertSystem.clearAlerts();
      res.json({ success: true, message: 'Alerts cleared' });
    } catch (error) {
      this.logger.error('Failed to clear alerts:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCopyTradingStats(req, res) {
    try {
      const stats = this.bot.copyTradingAgent.getCopyTradingStats();
      res.json(stats);
    } catch (error) {
      this.logger.error('Failed to get copy trading stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTopTraders(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const traders = this.bot.copyTradingAgent.getTopTraders(limit);
      
      res.json({
        traders,
        count: traders.length
      });
    } catch (error) {
      this.logger.error('Failed to get top traders:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async manualBuy(req, res) {
    try {
      const { tokenAddress, amount } = req.body;
      
      if (!tokenAddress || !amount) {
        return res.status(400).json({ error: 'Token address and amount are required' });
      }
      
      const result = await this.bot.walletManager.buyToken(tokenAddress, amount);
      await this.bot.alertSystem.tradeExecuted({
        action: 'buy',
        token: { symbol: tokenAddress },
        size: amount
      });
      
      res.json({
        success: true,
        result,
        message: `Bought token ${tokenAddress} for ${amount} SOL`
      });
    } catch (error) {
      this.logger.error('Failed to execute manual buy:', error);
      await this.bot.alertSystem.errorAlert(error, 'Manual Buy');
      res.status(500).json({ error: error.message });
    }
  }

  async manualSell(req, res) {
    try {
      const { tokenAddress, amount } = req.body;
      
      if (!tokenAddress || !amount) {
        return res.status(400).json({ error: 'Token address and amount are required' });
      }
      
      const result = await this.bot.walletManager.sellToken(tokenAddress, amount);
      await this.bot.alertSystem.tradeExecuted({
        action: 'sell',
        token: { symbol: tokenAddress },
        size: amount
      });
      
      res.json({
        success: true,
        result,
        message: `Sold ${amount} of token ${tokenAddress}`
      });
    } catch (error) {
      this.logger.error('Failed to execute manual sell:', error);
      await this.bot.alertSystem.errorAlert(error, 'Manual Sell');
      res.status(500).json({ error: error.message });
    }
  }

  async closePosition(req, res) {
    try {
      const { positionId } = req.body;
      
      if (!positionId) {
        return res.status(400).json({ error: 'Position ID is required' });
      }
      
      const position = this.bot.tradingAgent.getActivePositions()
        .find(p => p.id === positionId);
      
      if (!position) {
        return res.status(404).json({ error: 'Position not found' });
      }
      
      await this.bot.tradingAgent.closePosition(position);
      
      res.json({
        success: true,
        message: `Position ${positionId} closed successfully`
      });
    } catch (error) {
      this.logger.error('Failed to close position:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getConfig(req, res) {
    try {
      const config = require('../config/config');
      res.json(config);
    } catch (error) {
      this.logger.error('Failed to get config:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateConfig(req, res) {
    try {
      // In a production system, you'd want to validate and persist config changes
      res.json({
        success: false,
        message: 'Config updates not implemented in demo version'
      });
    } catch (error) {
      this.logger.error('Failed to update config:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPerformanceAnalysis(req, res) {
    try {
      const analysis = this.bot.tradingAgent.getPerformanceAnalysis();
      
      if (!analysis) {
        return res.status(404).json({ error: 'No performance data available' });
      }
      
      res.json({
        analysis,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get performance analysis:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getRiskAssessment(req, res) {
    try {
      const riskReport = this.bot.tradingAgent.getRiskReport();
      
      res.json({
        riskAssessment: riskReport,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get risk assessment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getRiskReport(req, res) {
    try {
      const riskManager = this.bot.tradingAgent.riskManager;
      const report = riskManager.getRiskReport();
      
      res.json({
        report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get risk report:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPortfolioPerformance(req, res) {
    try {
      const balance = this.bot.walletManager.getBalance();
      let totalValue = balance.sol * 240; // Assume $240 per SOL
      let totalPnL = 0;
      let positions = [];

      // Calculate token values and P&L
      for (const [symbol, tokenData] of Object.entries(balance.tokens)) {
        const currentValue = tokenData.balance * tokenData.price;
        const purchaseValue = tokenData.balance * (tokenData.purchasePrice || tokenData.price);
        const pnl = currentValue - purchaseValue;
        const pnlPercent = ((tokenData.price - (tokenData.purchasePrice || tokenData.price)) / (tokenData.purchasePrice || tokenData.price)) * 100;

        positions.push({
          symbol,
          balance: tokenData.balance,
          currentPrice: tokenData.price,
          purchasePrice: tokenData.purchasePrice || tokenData.price,
          currentValue: currentValue,
          pnl: pnl,
          pnlPercent: pnlPercent
        });

        totalValue += currentValue;
        totalPnL += pnl;
      }

      res.json({
        totalValue: totalValue,
        solBalance: balance.sol,
        totalPnL: totalPnL,
        totalPnLPercent: (totalPnL / (totalValue - totalPnL)) * 100,
        positions: positions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get portfolio performance:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCopyTradingTrades(req, res) {
    try {
      const copyAgent = this.bot.copyTradingAgent;
      const recentTrades = copyAgent.recentTrades.slice(-50); // Last 50 trades
      
      const formattedTrades = recentTrades.map(trade => ({
        timestamp: trade.timestamp,
        signature: trade.signature,
        copyTradeSignal: trade.copyTradeSignal
      }));

      res.json({
        trades: formattedTrades,
        count: formattedTrades.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get copy trading trades:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCopyTradingHistory(req, res) {
    try {
      const copyAgent = this.bot.copyTradingAgent;
      const allTrades = copyAgent.recentTrades;
      
      // Calculate performance metrics
      const executedTrades = allTrades.filter(t => t.copyTradeSignal?.executed);
      const totalInvested = executedTrades.reduce((sum, t) => sum + (t.copyTradeSignal?.copySizeSOL * 240 || 0), 0);
      const successRate = executedTrades.length > 0 ? (executedTrades.length / allTrades.length) * 100 : 0;

      res.json({
        totalTrades: allTrades.length,
        executedTrades: executedTrades.length,
        totalInvested: totalInvested,
        successRate: successRate,
        averageTradeSize: executedTrades.length > 0 ? totalInvested / executedTrades.length : 0,
        recentActivity: allTrades.slice(-10),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get copy trading history:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTradingHistory(req, res) {
    try {
      const copyAgent = this.bot.copyTradingAgent;
      const walletManager = this.bot.walletManager;
      
      const trades = copyAgent.recentTrades.map(trade => {
        const signal = trade.copyTradeSignal;
        return {
          id: trade.signature,
          timestamp: trade.timestamp,
          type: 'BUY',
          token: signal?.token,
          amount: signal?.tokensReceived,
          price: signal?.executionPrice,
          solSpent: signal?.copySizeSOL,
          usdValue: signal?.copyAmount,
          trader: signal?.originalTrader,
          status: signal?.executed ? 'EXECUTED' : 'FAILED',
          txId: signal?.txId
        };
      });

      res.json({
        trades: trades.reverse(), // Most recent first
        count: trades.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get trading history:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurrentPositions(req, res) {
    try {
      const balance = this.bot.walletManager.getBalance();
      const positions = [];

      for (const [symbol, tokenData] of Object.entries(balance.tokens)) {
        const currentValue = tokenData.balance * tokenData.price * 240; // Convert to USD
        const purchaseValue = tokenData.balance * (tokenData.purchasePrice || tokenData.price) * 240;
        const pnl = currentValue - purchaseValue;
        const pnlPercent = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;

        positions.push({
          symbol: symbol,
          balance: tokenData.balance,
          currentPrice: tokenData.price,
          purchasePrice: tokenData.purchasePrice || tokenData.price,
          currentValueUSD: currentValue,
          purchaseValueUSD: purchaseValue,
          pnlUSD: pnl,
          pnlPercent: pnlPercent,
          lastUpdated: new Date().toISOString()
        });
      }

      // Sort by current value descending
      positions.sort((a, b) => b.currentValueUSD - a.currentValueUSD);

      res.json({
        positions: positions,
        totalValue: positions.reduce((sum, p) => sum + p.currentValueUSD, 0),
        totalPnL: positions.reduce((sum, p) => sum + p.pnlUSD, 0),
        solBalance: balance.sol,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get current positions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getRealTimePnL(req, res) {
    try {
      const balance = this.bot.walletManager.getBalance();
      const copyAgent = this.bot.copyTradingAgent;
      
      let totalInvested = 0;
      let totalCurrentValue = 0;
      let positionsPnL = [];

      // Calculate P&L for each position
      for (const [symbol, tokenData] of Object.entries(balance.tokens)) {
        const currentValue = tokenData.balance * tokenData.price * 240;
        const purchaseValue = tokenData.balance * (tokenData.purchasePrice || tokenData.price) * 240;
        const pnl = currentValue - purchaseValue;

        positionsPnL.push({
          symbol: symbol,
          pnl: pnl,
          pnlPercent: purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0,
          currentValue: currentValue,
          purchaseValue: purchaseValue
        });

        totalInvested += purchaseValue;
        totalCurrentValue += currentValue;
      }

      const totalPnL = totalCurrentValue - totalInvested;
      const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

      res.json({
        totalInvested: totalInvested,
        totalCurrentValue: totalCurrentValue,
        totalPnL: totalPnL,
        totalPnLPercent: totalPnLPercent,
        positionsPnL: positionsPnL,
        solBalance: balance.sol,
        solValueUSD: balance.sol * 240,
        totalPortfolioUSD: totalCurrentValue + (balance.sol * 240),
        activeTrades: copyAgent.recentTrades.filter(t => t.copyTradeSignal?.executed).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get real-time P&L:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTradingAnalytics(req, res) {
    try {
      const copyAgent = this.bot.copyTradingAgent;
      const balance = this.bot.walletManager.getBalance();
      
      const trades = copyAgent.recentTrades;
      const executedTrades = trades.filter(t => t.copyTradeSignal?.executed);
      
      // Calculate analytics
      const totalTrades = trades.length;
      const successfulTrades = executedTrades.length;
      const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
      
      const totalInvested = executedTrades.reduce((sum, t) => sum + (t.copyTradeSignal?.copyAmount || 0), 0);
      const averageTradeSize = successfulTrades > 0 ? totalInvested / successfulTrades : 0;
      
      // Token distribution
      const tokenDistribution = {};
      for (const [symbol, data] of Object.entries(balance.tokens)) {
        const value = data.balance * data.price * 240;
        tokenDistribution[symbol] = {
          percentage: 0, // Will calculate below
          valueUSD: value,
          balance: data.balance
        };
      }
      
      const totalPortfolioValue = Object.values(tokenDistribution).reduce((sum, t) => sum + t.valueUSD, 0);
      for (const symbol in tokenDistribution) {
        tokenDistribution[symbol].percentage = totalPortfolioValue > 0 ? 
          (tokenDistribution[symbol].valueUSD / totalPortfolioValue) * 100 : 0;
      }

      // Top performers
      const topPerformers = Object.entries(balance.tokens)
        .map(([symbol, data]) => ({
          symbol,
          pnlPercent: data.purchasePrice ? ((data.price - data.purchasePrice) / data.purchasePrice) * 100 : 0,
          currentValue: data.balance * data.price * 240
        }))
        .sort((a, b) => b.pnlPercent - a.pnlPercent)
        .slice(0, 5);

      res.json({
        performance: {
          totalTrades,
          successfulTrades,
          successRate,
          totalInvested,
          averageTradeSize
        },
        portfolio: {
          tokenDistribution,
          totalValue: totalPortfolioValue,
          topPerformers
        },
        activity: {
          tradesLast24h: trades.filter(t => Date.now() - t.timestamp < 86400000).length,
          mostTradedToken: this.getMostTradedToken(trades),
          recentActivity: trades.slice(-5)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get trading analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getMostTradedToken(trades) {
    const tokenCounts = {};
    trades.forEach(trade => {
      const token = trade.copyTradeSignal?.token;
      if (token) {
        tokenCounts[token] = (tokenCounts[token] || 0) + 1;
      }
    });
    
    return Object.entries(tokenCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  }

  // ===== NEW ENHANCED API ENDPOINTS =====

  async getDiscoveredTokens(req, res) {
    try {
      const discoveredTokens = Array.from(this.bot.marketAgent.discoveredTokens.entries())
        .map(([address, data]) => ({
          address,
          ...data,
          ageMinutes: Math.floor((Date.now() - data.discoveredAt) / 60000)
        }))
        .sort((a, b) => b.potentialScore - a.potentialScore);

      res.json({
        success: true,
        data: {
          tokens: discoveredTokens,
          count: discoveredTokens.length,
          lastScan: this.bot.marketAgent.lastTokenScan,
          avgPotentialScore: discoveredTokens.length > 0 
            ? discoveredTokens.reduce((sum, t) => sum + t.potentialScore, 0) / discoveredTokens.length 
            : 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get discovered tokens:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getHighPerformanceTraders(req, res) {
    try {
      const traders = Array.from(this.bot.marketAgent.highPerformanceTraders.entries())
        .map(([address, data]) => ({
          address: address.slice(0, 8) + '...',
          winRate: data.winRate,
          trades3Months: data.trades3Months,
          totalPnL: data.totalPnL,
          avgTradeSize: data.avgTradeSize,
          lastActive: data.lastActive,
          recentTradesCount: data.recentTrades?.length || 0,
          favoriteTokens: data.tokenAnalysis?.favoriteTokens || [],
          minutesSinceLastTrade: Math.floor((Date.now() - data.lastActive) / 60000)
        }))
        .sort((a, b) => b.winRate - a.winRate);

      res.json({
        success: true,
        data: {
          traders: traders,
          count: traders.length,
          lastScan: this.bot.marketAgent.lastTraderScan,
          avgWinRate: traders.length > 0 
            ? traders.reduce((sum, t) => sum + t.winRate, 0) / traders.length 
            : 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get high performance traders:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTokenSentimentAnalysis(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: 'Token symbol required' });
      }

      const sentiment = await this.bot.socialAgent.analyzeTokenSentiment(token);
      
      res.json({
        success: true,
        data: sentiment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get token sentiment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAdvancedSignals(req, res) {
    try {
      const signals = {
        newTokenOpportunities: Array.from(this.bot.marketAgent.discoveredTokens.values())
          .filter(token => token.potentialScore > 0.7)
          .sort((a, b) => b.potentialScore - a.potentialScore)
          .slice(0, 10),
        
        highConfidenceTraders: Array.from(this.bot.marketAgent.highPerformanceTraders.values())
          .filter(trader => trader.winRate > 0.85)
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 5),
        
        recentCopyTrades: this.bot.copyTradingAgent.recentTrades
          .filter(trade => trade.type === 'copyTrade')
          .slice(-10),
        
        twitterTrending: Object.entries(this.bot.socialAgent.socialData.sentimentScores)
          .filter(([token, data]) => data.trendingScore > 0.6)
          .sort(([,a], [,b]) => b.trendingScore - a.trendingScore)
          .slice(0, 5)
          .map(([token, data]) => ({ token, ...data }))
      };

      res.json({
        success: true,
        data: signals,
        summary: {
          newTokens: signals.newTokenOpportunities.length,
          topTraders: signals.highConfidenceTraders.length,
          recentCopyTrades: signals.recentCopyTrades.length,
          trendingTokens: signals.twitterTrending.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get advanced signals:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async proxySaveTrade(req, res) {
    try {
      const id = await this.supabaseProxy.saveTrade(req.body);
      res.json({ success: true, id });
    } catch (e) {
      this.logger.error('proxySaveTrade error', e);
      res.status(500).json({ error: e.message });
    }
  }
  async proxyGetTrades(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const trades = await this.supabaseProxy.getTrades(limit);
      res.json({ trades });
    } catch (e) {
      this.logger.error('proxyGetTrades error', e);
      res.status(500).json({ error: e.message });
    }
  }
  async proxySaveUser(req, res) {
    try {
      const user = await this.supabaseProxy.saveUser(req.body);
      res.json({ success: true, user });
    } catch (e) {
      this.logger.error('proxySaveUser error', e);
      res.status(500).json({ error: e.message });
    }
  }
  async proxyGetUser(req, res) {
    try {
      const user = await this.supabaseProxy.getUser(req.params.email);
      res.json({ user });
    } catch (e) {
      this.logger.error('proxyGetUser error', e);
      res.status(500).json({ error: e.message });
    }
  }
  async proxySaveSettings(req, res) {
    try {
      const settings = await this.supabaseProxy.saveSettings(req.body.userId, req.body.settings);
      res.json({ success: true, settings });
    } catch (e) {
      this.logger.error('proxySaveSettings error', e);
      res.status(500).json({ error: e.message });
    }
  }
  async proxyGetSettings(req, res) {
    try {
      const settings = await this.supabaseProxy.getSettings(req.params.userId);
      res.json({ settings });
    } catch (e) {
      this.logger.error('proxyGetSettings error', e);
      res.status(500).json({ error: e.message });
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = APIRoutes;
