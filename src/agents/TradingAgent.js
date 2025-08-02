const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const Logger = require('../utils/Logger');
const RiskManager = require('../utils/RiskManager');
const PerformanceAnalyzer = require('../utils/PerformanceAnalyzer');

class TradingAgent {
  constructor() {
    this.logger = new Logger('TradingAgent');
    this.activePositions = [];
    this.tradingHistory = [];
    this.dailyPnL = 0;
    this.totalPnL = 0;
    this.riskManager = new RiskManager(require('../config/config'));
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  async initialize() {
    this.logger.info('💰 Initializing Trading Agent...');
    
    // Initialize trading parameters
    this.maxPositionSize = parseFloat(process.env.MAX_POSITION_SIZE) || 100;
    this.riskPercentage = parseFloat(process.env.RISK_PERCENTAGE) || 2;
    this.stopLossPercentage = parseFloat(process.env.STOP_LOSS_PERCENTAGE) || 5;
    this.takeProfitPercentage = parseFloat(process.env.TAKE_PROFIT_PERCENTAGE) || 10;
    this.tradingMode = process.env.TRADING_MODE || 'paper';
    
    this.logger.info(`Trading mode: ${this.tradingMode}`);
    this.logger.info('✅ Trading Agent initialized');
  }

  async analyzeTradingOpportunities(marketData, socialData) {
    try {
      const opportunities = marketData.marketData.opportunities || [];
      const sentiment = socialData.summary.overallSentiment || 0;
      
      const tradingDecisions = [];
      
      for (const opportunity of opportunities) {
        const decision = await this.evaluateOpportunity(opportunity, sentiment);
        if (decision) {
          tradingDecisions.push(decision);
        }
      }
      
      // Execute trading decisions
      for (const decision of tradingDecisions) {
        await this.executeTradeDecision(decision);
      }
      
      // Update positions
      await this.updatePositions();
      
      return tradingDecisions;
      
    } catch (error) {
      this.logger.error('Error analyzing trading opportunities:', error);
      return [];
    }
  }

  async evaluateOpportunity(opportunity, sentiment) {
    try {
      // Enhanced risk assessment using RiskManager
      const portfolioValue = this.getTotalPortfolioValue();
      const riskScore = this.riskManager.assessTradeRisk(opportunity, this.activePositions, portfolioValue);
      
      if (riskScore.recommendation === 'REJECT') {
        this.logger.warn(`Trade rejected due to high risk: ${opportunity.token.symbol}`);
        return null;
      }
      
      // Check for emergency stop conditions
      const emergencyCheck = this.riskManager.shouldEmergencyStop(this.dailyPnL, this.totalPnL, portfolioValue);
      if (emergencyCheck.shouldStop) {
        this.logger.error('🚨 Emergency stop triggered:', emergencyCheck.reasons);
        return null;
      }
      
      // Sentiment confirmation
      const sentimentMultiplier = this.calculateSentimentMultiplier(sentiment);
      const adjustedConfidence = opportunity.confidence * sentimentMultiplier;
      
      // Enhanced position sizing with risk consideration
      const positionSize = this.riskManager.calculatePositionSize(
        adjustedConfidence, 
        riskScore, 
        portfolioValue
      );
      
      if (positionSize < 10) { // Minimum position size in USD
        return null;
      }
      
      // Validate stop loss
      const stopLossValidation = this.riskManager.validateStopLoss(opportunity.entry, opportunity.stopLoss);
      if (!stopLossValidation.isValid) {
        this.logger.warn(`Invalid stop loss for ${opportunity.token.symbol}: ${stopLossValidation.recommendation}`);
        // Adjust stop loss
        opportunity.stopLoss = opportunity.entry * (1 - 0.05); // 5% stop loss
      }
      
      // Trading decision with enhanced risk data
      const decision = {
        action: 'buy',
        token: opportunity.token,
        confidence: adjustedConfidence,
        positionSize: positionSize,
        entry: opportunity.entry,
        stopLoss: opportunity.stopLoss,
        takeProfit: opportunity.takeProfit,
        riskScore: riskScore,
        timestamp: Date.now(),
        reason: this.generateTradeReason(opportunity, sentiment, riskScore)
      };
      
      this.logger.info(`🎯 Enhanced trade decision: ${decision.action} ${decision.token.symbol} - Confidence: ${adjustedConfidence.toFixed(2)}, Risk: ${riskScore.overall.toFixed(2)}`);
      
      return decision;
      
    } catch (error) {
      this.logger.error('Error evaluating opportunity:', error);
      return null;
    }
  }

  calculateSentimentMultiplier(sentiment) {
    // Adjust confidence based on overall market sentiment
    if (sentiment > 0.3) return 1.2; // Very bullish
    if (sentiment > 0.1) return 1.1; // Bullish
    if (sentiment < -0.3) return 0.8; // Very bearish
    if (sentiment < -0.1) return 0.9; // Bearish
    return 1.0; // Neutral
  }

  calculatePositionSize(confidence, riskScore) {
    // Base position size on confidence and risk
    const baseSize = this.maxPositionSize * confidence;
    const riskAdjustedSize = baseSize * (1 - riskScore);
    
    // Ensure we don't exceed risk limits
    const maxRiskAmount = this.getTotalPortfolioValue() * (this.riskPercentage / 100);
    
    return Math.min(riskAdjustedSize, maxRiskAmount);
  }

  async executeTradeDecision(decision) {
    try {
      if (this.tradingMode === 'paper') {
        await this.executePaperTrade(decision);
      } else {
        await this.executeLiveTrade(decision);
      }
    } catch (error) {
      this.logger.error('Error executing trade decision:', error);
    }
  }

  async executePaperTrade(decision) {
    // Simulate trade execution for paper trading
    const position = {
      id: this.generatePositionId(),
      token: decision.token,
      action: decision.action,
      size: decision.positionSize,
      entryPrice: decision.entry,
      currentPrice: decision.entry,
      stopLoss: decision.stopLoss,
      takeProfit: decision.takeProfit,
      confidence: decision.confidence,
      openTime: Date.now(),
      status: 'open',
      pnl: 0,
      type: 'paper'
    };
    
    this.activePositions.push(position);
    
    this.logger.info(`📝 Paper trade executed: ${decision.action} ${decision.token.symbol} for $${decision.positionSize}`);
    
    // Add to trading history
    this.tradingHistory.push({
      ...position,
      reason: decision.reason
    });
  }

  async executeLiveTrade(decision) {
    this.logger.info(`🚀 Executing live trade: ${decision.action} ${decision.token.symbol}`);
    
    try {
      // This would implement actual Solana trading logic
      // For now, we'll simulate it
      
      const position = {
        id: this.generatePositionId(),
        token: decision.token,
        action: decision.action,
        size: decision.positionSize,
        entryPrice: decision.entry,
        currentPrice: decision.entry,
        stopLoss: decision.stopLoss,
        takeProfit: decision.takeProfit,
        confidence: decision.confidence,
        openTime: Date.now(),
        status: 'open',
        pnl: 0,
        type: 'live'
      };
      
      this.activePositions.push(position);
      
      this.logger.info(`✅ Live trade executed: ${decision.action} ${decision.token.symbol} for $${decision.positionSize}`);
      
    } catch (error) {
      this.logger.error('Failed to execute live trade:', error);
      throw error;
    }
  }

  async updatePositions() {
    try {
      for (const position of this.activePositions) {
        // Get current price
        const currentPrice = await this.getCurrentPrice(position.token);
        
        if (currentPrice) {
          position.currentPrice = currentPrice;
          position.pnl = this.calculatePnL(position);
          
          // Check stop loss and take profit
          if (this.shouldClosePosition(position)) {
            await this.closePosition(position);
          }
        }
      }
      
      // Update daily P&L
      this.updateDailyPnL();
      
    } catch (error) {
      this.logger.error('Error updating positions:', error);
    }
  }

  async getCurrentPrice(token) {
    try {
      // Get current price from CoinGecko or other price feed
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: token.id,
          vs_currencies: 'usd'
        }
      });
      
      return response.data[token.id]?.usd;
      
    } catch (error) {
      this.logger.error(`Failed to get current price for ${token.symbol}:`, error);
      return null;
    }
  }

  calculatePnL(position) {
    const priceChange = position.currentPrice - position.entryPrice;
    const percentChange = (priceChange / position.entryPrice) * 100;
    
    if (position.action === 'buy') {
      return (position.size * percentChange) / 100;
    } else {
      return -(position.size * percentChange) / 100;
    }
  }

  shouldClosePosition(position) {
    const currentPrice = position.currentPrice;
    const entryPrice = position.entryPrice;
    
    // Check stop loss
    if (position.action === 'buy' && currentPrice <= position.stopLoss) {
      return { reason: 'stop_loss', price: currentPrice };
    }
    
    // Check take profit
    if (position.action === 'buy' && currentPrice >= position.takeProfit) {
      return { reason: 'take_profit', price: currentPrice };
    }
    
    // Time-based exit (close after 24 hours for memecoins)
    const hoursOpen = (Date.now() - position.openTime) / (1000 * 60 * 60);
    if (hoursOpen > 24) {
      return { reason: 'time_exit', price: currentPrice };
    }
    
    return false;
  }

  async closePosition(position) {
    try {
      const closeReason = this.shouldClosePosition(position);
      
      position.status = 'closed';
      position.closeTime = Date.now();
      position.closePrice = position.currentPrice;
      position.closeReason = closeReason.reason;
      
      // Remove from active positions
      this.activePositions = this.activePositions.filter(p => p.id !== position.id);
      
      // Update totals
      this.totalPnL += position.pnl;
      
      this.logger.info(`🔒 Position closed: ${position.token.symbol} - P&L: $${position.pnl.toFixed(2)} (${closeReason.reason})`);
      
      // Add to history
      this.tradingHistory.push({
        ...position,
        finalPnL: position.pnl
      });
      
    } catch (error) {
      this.logger.error('Error closing position:', error);
    }
  }

  updateDailyPnL() {
    const today = new Date().toDateString();
    const todayTrades = this.tradingHistory.filter(trade => 
      new Date(trade.closeTime).toDateString() === today
    );
    
    this.dailyPnL = todayTrades.reduce((sum, trade) => sum + (trade.finalPnL || 0), 0);
  }

  generateTradeReason(opportunity, sentiment, riskScore) {
    const reasons = [];
    
    if (opportunity.confidence > 0.7) reasons.push('High confidence signal');
    if (sentiment > 0.2) reasons.push('Bullish market sentiment');
    if (opportunity.type === 'memecoin') reasons.push('Memecoin opportunity');
    if (riskScore.overall < 0.3) reasons.push('Low risk profile');
    
    // Add specific risk factors that influenced the decision
    if (riskScore.factors.marketCap) reasons.push('Market cap consideration');
    if (riskScore.factors.liquidity) reasons.push('Liquidity analysis');
    
    return reasons.join(', ') || 'Technical analysis signal';
  }

  generatePositionId() {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTotalPortfolioValue() {
    // This would get the actual wallet balance
    // For now, return a default value
    return 1000; // $1000 default portfolio
  }

  getActivePositions() {
    return this.activePositions;
  }

  getDailyPnL() {
    return this.dailyPnL;
  }

  getTotalPnL() {
    return this.totalPnL;
  }

  getTradingHistory() {
    return this.tradingHistory;
  }

  getPerformanceAnalysis() {
    try {
      // Create portfolio history from trading data
      const portfolioHistory = this.generatePortfolioHistory();
      
      // Get comprehensive performance analysis
      const analysis = this.performanceAnalyzer.analyzeTradingPerformance(
        this.tradingHistory,
        portfolioHistory,
        1000 // Initial balance
      );
      
      return analysis;
    } catch (error) {
      this.logger.error('Error generating performance analysis:', error);
      return null;
    }
  }

  generatePortfolioHistory() {
    // Generate portfolio value over time based on trades
    const history = [];
    let currentValue = 1000; // Starting value
    
    // Sort trades by timestamp
    const sortedTrades = [...this.tradingHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const trade of sortedTrades) {
      if (trade.action === 'sell' && trade.pnl !== undefined) {
        currentValue += trade.pnl;
      }
      
      history.push({
        date: new Date(trade.timestamp),
        portfolioValue: currentValue,
        cash: currentValue * 0.7, // Assume 70% cash, 30% positions
        positions: this.activePositions.length
      });
    }
    
    return history;
  }

  getRiskReport() {
    const portfolioValue = this.getTotalPortfolioValue();
    const walletBalance = { sol: portfolioValue / 100 }; // Mock conversion
    
    return this.riskManager.assessPortfolioRisk(this.activePositions, walletBalance);
  }
}

module.exports = TradingAgent;
