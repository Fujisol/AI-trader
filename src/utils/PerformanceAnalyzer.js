const Logger = require('../utils/Logger');

class PerformanceAnalyzer {
  constructor() {
    this.logger = new Logger('PerformanceAnalyzer');
  }

  analyzeTradingPerformance(trades, portfolioHistory, initialBalance = 1000) {
    try {
      const analysis = {
        overview: this.calculateOverviewMetrics(trades, portfolioHistory, initialBalance),
        profitability: this.analyzeProfitability(trades),
        riskMetrics: this.calculateRiskMetrics(trades, portfolioHistory),
        efficiency: this.analyzeEfficiency(trades),
        patterns: this.identifyPatterns(trades),
        recommendations: []
      };

      analysis.recommendations = this.generateRecommendations(analysis);
      
      return analysis;
      
    } catch (error) {
      this.logger.error('Error analyzing trading performance:', error);
      return this.getErrorAnalysis();
    }
  }

  calculateOverviewMetrics(trades, portfolioHistory, initialBalance) {
    const closedTrades = trades.filter(t => t.action === 'sell');
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const currentBalance = portfolioHistory.length > 0 ? 
      portfolioHistory[portfolioHistory.length - 1].portfolioValue : initialBalance;
    
    return {
      totalTrades: closedTrades.length,
      totalReturn: ((currentBalance - initialBalance) / initialBalance) * 100,
      totalPnL: totalPnL,
      currentBalance: currentBalance,
      tradingPeriod: this.calculateTradingPeriod(trades),
      averageTradeValue: closedTrades.length > 0 ? 
        closedTrades.reduce((sum, t) => sum + t.value, 0) / closedTrades.length : 0
    };
  }

  analyzeProfitability(trades) {
    const closedTrades = trades.filter(t => t.action === 'sell' && t.pnl !== undefined);
    
    if (closedTrades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        winningTrades: 0,
        losingTrades: 0
      };
    }

    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl <= 0);
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    return {
      winRate: (winningTrades.length / closedTrades.length) * 100,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length
    };
  }

  calculateRiskMetrics(trades, portfolioHistory) {
    const closedTrades = trades.filter(t => t.action === 'sell' && t.pnl !== undefined);
    
    if (closedTrades.length === 0 || portfolioHistory.length === 0) {
      return {
        maxDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0,
        calmarRatio: 0,
        consecutiveLosses: 0,
        riskOfRuin: 0
      };
    }

    const returns = this.calculateReturns(portfolioHistory);
    const maxDrawdown = this.calculateMaxDrawdown(portfolioHistory);
    const consecutiveLosses = this.calculateMaxConsecutiveLosses(closedTrades);
    
    return {
      maxDrawdown: maxDrawdown,
      sharpeRatio: this.calculateSharpeRatio(returns),
      volatility: this.calculateVolatility(returns),
      calmarRatio: maxDrawdown > 0 ? this.calculateAnnualizedReturn(returns) / maxDrawdown : 0,
      consecutiveLosses: consecutiveLosses,
      riskOfRuin: this.estimateRiskOfRuin(closedTrades)
    };
  }

  analyzeEfficiency(trades) {
    const closedTrades = trades.filter(t => t.action === 'sell');
    
    if (closedTrades.length === 0) {
      return {
        averageHoldTime: 0,
        tradingFrequency: 0,
        capitalUtilization: 0,
        opportunityRatio: 0
      };
    }

    const totalHoldTime = closedTrades.reduce((sum, trade) => {
      return sum + (trade.holdTime || 0);
    }, 0);

    const averageHoldTime = totalHoldTime / closedTrades.length;
    const tradingPeriod = this.calculateTradingPeriod(trades);
    
    return {
      averageHoldTime: averageHoldTime / (1000 * 60 * 60), // Convert to hours
      tradingFrequency: tradingPeriod > 0 ? closedTrades.length / (tradingPeriod / (1000 * 60 * 60 * 24)) : 0, // Trades per day
      capitalUtilization: this.calculateCapitalUtilization(trades),
      opportunityRatio: this.calculateOpportunityRatio(trades)
    };
  }

  identifyPatterns(trades) {
    const closedTrades = trades.filter(t => t.action === 'sell');
    
    return {
      bestPerformingHours: this.findBestTradingHours(closedTrades),
      bestPerformingDays: this.findBestTradingDays(closedTrades),
      profitableStrategies: this.identifyProfitableStrategies(closedTrades),
      seasonalPatterns: this.analyzeSeasonalPatterns(closedTrades)
    };
  }

  calculateReturns(portfolioHistory) {
    if (portfolioHistory.length < 2) return [];
    
    const returns = [];
    for (let i = 1; i < portfolioHistory.length; i++) {
      const prevValue = portfolioHistory[i - 1].portfolioValue;
      const currentValue = portfolioHistory[i].portfolioValue;
      const returnRate = (currentValue - prevValue) / prevValue;
      returns.push(returnRate);
    }
    
    return returns;
  }

  calculateMaxDrawdown(portfolioHistory) {
    if (portfolioHistory.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = portfolioHistory[0].portfolioValue;
    
    for (const point of portfolioHistory) {
      if (point.portfolioValue > peak) {
        peak = point.portfolioValue;
      }
      
      const drawdown = (peak - point.portfolioValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown * 100; // Return as percentage
  }

  calculateSharpeRatio(returns) {
    if (returns.length === 0) return 0;
    
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    
    // Assuming risk-free rate of 0 for simplicity
    return volatility > 0 ? averageReturn / volatility : 0;
  }

  calculateVolatility(returns) {
    if (returns.length === 0) return 0;
    
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  calculateAnnualizedReturn(returns) {
    if (returns.length === 0) return 0;
    
    const totalReturn = returns.reduce((product, r) => product * (1 + r), 1) - 1;
    const periodsPerYear = 365; // Assuming daily returns
    const annualizedReturn = Math.pow(1 + totalReturn, periodsPerYear / returns.length) - 1;
    
    return annualizedReturn * 100;
  }

  calculateMaxConsecutiveLosses(trades) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (const trade of trades) {
      if (trade.pnl <= 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    
    return maxConsecutive;
  }

  estimateRiskOfRuin(trades) {
    // Simplified risk of ruin calculation
    const winRate = trades.filter(t => t.pnl > 0).length / trades.length;
    const avgWin = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl > 0).length || 0;
    const avgLoss = Math.abs(trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0)) / trades.filter(t => t.pnl <= 0).length || 0;
    
    if (avgWin === 0 || avgLoss === 0) return 0;
    
    const winLossRatio = avgWin / avgLoss;
    const edge = (winRate * winLossRatio) - (1 - winRate);
    
    // If edge is negative, risk of ruin is high
    return edge < 0 ? 50 : Math.max(0, 100 - (edge * 100));
  }

  calculateTradingPeriod(trades) {
    if (trades.length === 0) return 0;
    
    const timestamps = trades.map(t => t.timestamp).sort((a, b) => a - b);
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  calculateCapitalUtilization(trades) {
    // Simplified capital utilization - percentage of time capital was deployed
    const closedTrades = trades.filter(t => t.action === 'sell');
    if (closedTrades.length === 0) return 0;
    
    const totalHoldTime = closedTrades.reduce((sum, t) => sum + (t.holdTime || 0), 0);
    const tradingPeriod = this.calculateTradingPeriod(trades);
    
    return tradingPeriod > 0 ? (totalHoldTime / tradingPeriod) * 100 : 0;
  }

  calculateOpportunityRatio(trades) {
    // Ratio of profitable to total opportunities
    const closedTrades = trades.filter(t => t.action === 'sell');
    const profitableTrades = closedTrades.filter(t => t.pnl > 0);
    
    return closedTrades.length > 0 ? (profitableTrades.length / closedTrades.length) * 100 : 0;
  }

  findBestTradingHours(trades) {
    const hourlyPnL = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    
    for (const trade of trades) {
      const hour = new Date(trade.timestamp).getUTCHours();
      hourlyPnL[hour] += trade.pnl || 0;
      hourlyCounts[hour]++;
    }
    
    return hourlyPnL.map((pnl, hour) => ({
      hour,
      averagePnL: hourlyCounts[hour] > 0 ? pnl / hourlyCounts[hour] : 0,
      tradeCount: hourlyCounts[hour]
    })).sort((a, b) => b.averagePnL - a.averagePnL);
  }

  findBestTradingDays(trades) {
    const dailyPnL = {};
    
    for (const trade of trades) {
      const day = new Date(trade.timestamp).getUTCDay();
      if (!dailyPnL[day]) {
        dailyPnL[day] = { pnl: 0, count: 0 };
      }
      dailyPnL[day].pnl += trade.pnl || 0;
      dailyPnL[day].count++;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return Object.entries(dailyPnL).map(([day, data]) => ({
      day: dayNames[parseInt(day)],
      averagePnL: data.count > 0 ? data.pnl / data.count : 0,
      tradeCount: data.count
    })).sort((a, b) => b.averagePnL - a.averagePnL);
  }

  identifyProfitableStrategies(trades) {
    // Group trades by reason/strategy
    const strategies = {};
    
    for (const trade of trades) {
      const reason = trade.reason || 'Unknown';
      if (!strategies[reason]) {
        strategies[reason] = { pnl: 0, count: 0, wins: 0 };
      }
      strategies[reason].pnl += trade.pnl || 0;
      strategies[reason].count++;
      if (trade.pnl > 0) strategies[reason].wins++;
    }
    
    return Object.entries(strategies).map(([strategy, data]) => ({
      strategy,
      totalPnL: data.pnl,
      averagePnL: data.count > 0 ? data.pnl / data.count : 0,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      tradeCount: data.count
    })).sort((a, b) => b.totalPnL - a.totalPnL);
  }

  analyzeSeasonalPatterns(trades) {
    // Monthly analysis
    const monthlyData = {};
    
    for (const trade of trades) {
      const month = new Date(trade.timestamp).getUTCMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = { pnl: 0, count: 0 };
      }
      monthlyData[month].pnl += trade.pnl || 0;
      monthlyData[month].count++;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: monthNames[parseInt(month)],
      averagePnL: data.count > 0 ? data.pnl / data.count : 0,
      tradeCount: data.count
    }));
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Win rate recommendations
    if (analysis.profitability.winRate < 40) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        message: 'Consider improving entry criteria - win rate is below 40%'
      });
    }
    
    // Risk recommendations
    if (analysis.riskMetrics.maxDrawdown > 20) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        message: 'Reduce position sizes - maximum drawdown exceeds 20%'
      });
    }
    
    // Efficiency recommendations
    if (analysis.efficiency.averageHoldTime > 48) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        message: 'Consider shorter holding periods - current average is over 48 hours'
      });
    }
    
    // Profitability recommendations
    if (analysis.profitability.profitFactor < 1.5) {
      recommendations.push({
        type: 'profitability',
        priority: 'high',
        message: 'Improve profit factor by letting winners run longer or cutting losses faster'
      });
    }
    
    return recommendations;
  }

  getErrorAnalysis() {
    return {
      overview: { totalTrades: 0, totalReturn: 0, totalPnL: 0 },
      profitability: { winRate: 0, profitFactor: 0 },
      riskMetrics: { maxDrawdown: 0, sharpeRatio: 0 },
      efficiency: { averageHoldTime: 0, tradingFrequency: 0 },
      patterns: { bestPerformingHours: [], bestPerformingDays: [] },
      recommendations: [{ 
        type: 'error', 
        priority: 'high', 
        message: 'Performance analysis failed - check data quality' 
      }]
    };
  }
}

module.exports = PerformanceAnalyzer;
