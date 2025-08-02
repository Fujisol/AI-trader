const Logger = require('../utils/Logger');

class BacktestEngine {
  constructor() {
    this.logger = new Logger('BacktestEngine');
    this.results = [];
  }

  async runBacktest(strategy, historicalData, config = {}) {
    this.logger.info(`🔬 Starting backtest for ${strategy.name}...`);
    
    const startTime = Date.now();
    const portfolio = {
      cash: config.initialCash || 1000,
      positions: [],
      totalValue: config.initialCash || 1000
    };
    
    const trades = [];
    let currentDate = new Date(historicalData[0].timestamp);
    
    for (let i = 0; i < historicalData.length; i++) {
      const dataPoint = historicalData[i];
      currentDate = new Date(dataPoint.timestamp);
      
      // Update portfolio value
      this.updatePortfolioValue(portfolio, dataPoint);
      
      // Check for exit signals on existing positions
      await this.checkExitSignals(portfolio, dataPoint, strategy, trades);
      
      // Check for entry signals
      await this.checkEntrySignals(portfolio, dataPoint, strategy, trades, config);
      
      // Record daily portfolio value
      if (i % 24 === 0) { // Every 24 hours
        this.results.push({
          date: currentDate,
          portfolioValue: portfolio.totalValue,
          cash: portfolio.cash,
          positions: portfolio.positions.length
        });
      }
    }
    
    // Close all remaining positions
    for (const position of portfolio.positions) {
      const lastPrice = historicalData[historicalData.length - 1].price;
      this.closePosition(portfolio, position, lastPrice, 'backtest_end', trades);
    }
    
    const endTime = Date.now();
    const summary = this.generateSummary(trades, portfolio, config.initialCash || 1000);
    
    this.logger.info(`✅ Backtest completed in ${endTime - startTime}ms`);
    this.logger.info(`📊 Results: ${summary.totalReturn.toFixed(2)}% return, ${summary.winRate.toFixed(1)}% win rate`);
    
    return {
      summary,
      trades,
      portfolioHistory: this.results,
      finalPortfolio: portfolio
    };
  }

  updatePortfolioValue(portfolio, dataPoint) {
    let totalValue = portfolio.cash;
    
    for (const position of portfolio.positions) {
      const currentValue = position.quantity * dataPoint.price;
      position.currentValue = currentValue;
      position.unrealizedPnL = currentValue - position.cost;
      totalValue += currentValue;
    }
    
    portfolio.totalValue = totalValue;
  }

  async checkExitSignals(portfolio, dataPoint, strategy, trades) {
    const positionsToClose = [];
    
    for (const position of portfolio.positions) {
      const timeHeld = dataPoint.timestamp - position.entryTime;
      const exitDecision = strategy.shouldExit(position, dataPoint.price, timeHeld);
      
      if (exitDecision.shouldExit) {
        positionsToClose.push({ position, reason: exitDecision.reason });
      }
    }
    
    for (const { position, reason } of positionsToClose) {
      this.closePosition(portfolio, position, dataPoint.price, reason, trades);
    }
  }

  async checkEntrySignals(portfolio, dataPoint, strategy, trades, config) {
    // Create mock token object for strategy analysis
    const token = {
      symbol: config.symbol || 'TEST',
      name: config.name || 'Test Token',
      current_price: dataPoint.price,
      price_change_percentage_24h: dataPoint.change24h || 0,
      market_cap: dataPoint.marketCap || 1000000,
      total_volume: dataPoint.volume || 100000
    };
    
    // Mock social data
    const socialData = {
      socialData: {
        twitterMentions: {},
        trendingTopics: []
      }
    };
    
    const analysis = strategy.analyze(token, {}, socialData);
    
    if (analysis.confidence > (config.minConfidence || 0.6) && portfolio.positions.length < (config.maxPositions || 5)) {
      const positionSize = strategy.getPositionSize(analysis.confidence, portfolio.totalValue);
      
      if (positionSize <= portfolio.cash) {
        this.openPosition(portfolio, token, dataPoint.price, positionSize, analysis, trades);
      }
    }
  }

  openPosition(portfolio, token, price, size, analysis, trades) {
    const quantity = size / price;
    const position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: token.symbol,
      quantity: quantity,
      entryPrice: price,
      cost: size,
      entryTime: Date.now(),
      confidence: analysis.confidence,
      currentValue: size,
      unrealizedPnL: 0
    };
    
    portfolio.positions.push(position);
    portfolio.cash -= size;
    
    trades.push({
      id: position.id,
      action: 'buy',
      symbol: token.symbol,
      quantity: quantity,
      price: price,
      value: size,
      timestamp: Date.now(),
      confidence: analysis.confidence
    });
  }

  closePosition(portfolio, position, price, reason, trades) {
    const value = position.quantity * price;
    const pnl = value - position.cost;
    
    portfolio.cash += value;
    portfolio.positions = portfolio.positions.filter(p => p.id !== position.id);
    
    trades.push({
      id: position.id,
      action: 'sell',
      symbol: position.symbol,
      quantity: position.quantity,
      price: price,
      value: value,
      pnl: pnl,
      reason: reason,
      timestamp: Date.now(),
      holdTime: Date.now() - position.entryTime
    });
  }

  generateSummary(trades, finalPortfolio, initialCash) {
    const buyTrades = trades.filter(t => t.action === 'buy');
    const sellTrades = trades.filter(t => t.action === 'sell');
    
    const totalReturn = ((finalPortfolio.totalValue - initialCash) / initialCash) * 100;
    const totalPnL = sellTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const winningTrades = sellTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = sellTrades.filter(t => (t.pnl || 0) <= 0);
    
    const winRate = sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0;
    
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    
    const avgLoss = losingTrades.length > 0 ? 
      losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;
    
    const maxWin = sellTrades.length > 0 ? Math.max(...sellTrades.map(t => t.pnl || 0)) : 0;
    const maxLoss = sellTrades.length > 0 ? Math.min(...sellTrades.map(t => t.pnl || 0)) : 0;
    
    // Calculate Sharpe ratio (simplified)
    const returns = this.results.map((r, i) => {
      if (i === 0) return 0;
      return (r.portfolioValue - this.results[i-1].portfolioValue) / this.results[i-1].portfolioValue;
    }).slice(1);
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
    
    return {
      initialCash,
      finalValue: finalPortfolio.totalValue,
      totalReturn,
      totalPnL,
      totalTrades: sellTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      maxWin,
      maxLoss,
      profitFactor: Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0,
      sharpeRatio: sharpeRatio * Math.sqrt(365), // Annualized
      maxDrawdown: this.calculateMaxDrawdown(),
      tradingDays: this.results.length
    };
  }

  calculateMaxDrawdown() {
    let maxDrawdown = 0;
    let peak = this.results[0]?.portfolioValue || 0;
    
    for (const result of this.results) {
      if (result.portfolioValue > peak) {
        peak = result.portfolioValue;
      }
      
      const drawdown = (peak - result.portfolioValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown * 100; // Return as percentage
  }

  generateHistoricalData(symbol, days = 30) {
    // Generate mock historical data for testing
    const data = [];
    let price = 1.0;
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < days * 24; i++) { // Hourly data
      const timestamp = startTime + (i * 60 * 60 * 1000);
      
      // Random walk with some trend
      const change = (Math.random() - 0.5) * 0.1; // -5% to +5%
      price = Math.max(0.001, price * (1 + change));
      
      data.push({
        timestamp,
        price,
        volume: Math.random() * 100000 + 10000,
        marketCap: price * 1000000,
        change24h: change * 100
      });
    }
    
    return data;
  }

  clearResults() {
    this.results = [];
  }
}

module.exports = BacktestEngine;
