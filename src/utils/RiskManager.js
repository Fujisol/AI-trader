const Logger = require('../utils/Logger');

class RiskManager {
  constructor(config) {
    this.logger = new Logger('RiskManager');
    this.config = config;
    this.riskMetrics = {
      totalExposure: 0,
      dailyLoss: 0,
      consecutiveLosses: 0,
      maxDrawdown: 0,
      lastRiskCheck: Date.now()
    };
  }

  assessPortfolioRisk(positions, walletBalance) {
    try {
      const totalPortfolioValue = this.calculatePortfolioValue(positions, walletBalance);
      const activePositionValue = positions.reduce((sum, pos) => sum + pos.size, 0);
      
      const riskAssessment = {
        totalValue: totalPortfolioValue,
        exposure: activePositionValue / totalPortfolioValue,
        positionCount: positions.length,
        riskLevel: 'LOW',
        warnings: [],
        recommendations: []
      };

      // Check exposure limits
      if (riskAssessment.exposure > this.config.trading.maxPortfolioRisk) {
        riskAssessment.riskLevel = 'HIGH';
        riskAssessment.warnings.push(`Portfolio exposure too high: ${(riskAssessment.exposure * 100).toFixed(1)}%`);
        riskAssessment.recommendations.push('Close some positions to reduce exposure');
      }

      // Check position count
      if (riskAssessment.positionCount > this.config.trading.maxActivePositions) {
        riskAssessment.riskLevel = 'MEDIUM';
        riskAssessment.warnings.push(`Too many active positions: ${riskAssessment.positionCount}`);
        riskAssessment.recommendations.push('Consider closing weaker positions');
      }

      // Check individual position sizes
      const oversizedPositions = positions.filter(pos => 
        pos.size > this.config.trading.maxPositionSize
      );
      
      if (oversizedPositions.length > 0) {
        riskAssessment.riskLevel = 'MEDIUM';
        riskAssessment.warnings.push(`${oversizedPositions.length} positions exceed size limit`);
        riskAssessment.recommendations.push('Reduce position sizes');
      }

      // Check for concentration risk
      const tokenExposure = this.calculateTokenConcentration(positions);
      const maxConcentration = Math.max(...Object.values(tokenExposure));
      
      if (maxConcentration > 0.3) { // More than 30% in single token
        riskAssessment.riskLevel = 'HIGH';
        riskAssessment.warnings.push(`High concentration in single token: ${(maxConcentration * 100).toFixed(1)}%`);
        riskAssessment.recommendations.push('Diversify holdings across more tokens');
      }

      // Update risk metrics
      this.updateRiskMetrics(riskAssessment);

      return riskAssessment;
      
    } catch (error) {
      this.logger.error('Error assessing portfolio risk:', error);
      return {
        riskLevel: 'ERROR',
        warnings: ['Risk assessment failed'],
        recommendations: ['Manual review required']
      };
    }
  }

  assessTradeRisk(opportunity, currentPositions, portfolioValue) {
    try {
      const riskScore = {
        overall: 0,
        factors: {},
        recommendation: 'PROCEED'
      };

      // Market cap risk
      const marketCap = opportunity.token.market_cap || 0;
      if (marketCap < 100000) {
        riskScore.factors.marketCap = 0.4;
        riskScore.overall += 0.4;
      } else if (marketCap < 1000000) {
        riskScore.factors.marketCap = 0.2;
        riskScore.overall += 0.2;
      }

      // Volatility risk
      const priceChange = Math.abs(opportunity.token.price_change_percentage_24h || 0);
      if (priceChange > 50) {
        riskScore.factors.volatility = 0.3;
        riskScore.overall += 0.3;
      } else if (priceChange > 20) {
        riskScore.factors.volatility = 0.1;
        riskScore.overall += 0.1;
      }

      // Liquidity risk
      const volume = opportunity.token.total_volume || 0;
      if (volume < 50000) {
        riskScore.factors.liquidity = 0.3;
        riskScore.overall += 0.3;
      } else if (volume < 100000) {
        riskScore.factors.liquidity = 0.1;
        riskScore.overall += 0.1;
      }

      // Position size risk
      const positionSize = opportunity.entry * (opportunity.confidence || 0.5) * this.config.trading.maxPositionSize;
      const sizeRisk = positionSize / portfolioValue;
      
      if (sizeRisk > 0.1) { // More than 10% of portfolio
        riskScore.factors.positionSize = 0.2;
        riskScore.overall += 0.2;
      }

      // Correlation risk (similar tokens)
      const similarTokens = currentPositions.filter(pos => 
        this.areTokensSimilar(pos.token, opportunity.token)
      );
      
      if (similarTokens.length > 0) {
        riskScore.factors.correlation = 0.2;
        riskScore.overall += 0.2;
      }

      // Timing risk
      const hour = new Date().getUTCHours();
      if (hour < 6 || hour > 22) { // Outside major trading hours
        riskScore.factors.timing = 0.1;
        riskScore.overall += 0.1;
      }

      // Determine recommendation
      if (riskScore.overall > 0.7) {
        riskScore.recommendation = 'REJECT';
      } else if (riskScore.overall > 0.4) {
        riskScore.recommendation = 'REDUCE_SIZE';
      }

      return riskScore;
      
    } catch (error) {
      this.logger.error('Error assessing trade risk:', error);
      return {
        overall: 1.0,
        recommendation: 'REJECT',
        factors: { error: 1.0 }
      };
    }
  }

  shouldEmergencyStop(dailyPnL, totalPnL, portfolioValue) {
    const emergencyConditions = [];

    // Daily loss limit
    const dailyLossPercent = Math.abs(dailyPnL) / portfolioValue;
    if (dailyLossPercent > this.config.wallet.emergencyStopLoss) {
      emergencyConditions.push(`Daily loss exceeds ${this.config.wallet.emergencyStopLoss * 100}%`);
    }

    // Consecutive losses
    if (this.riskMetrics.consecutiveLosses > 5) {
      emergencyConditions.push('Too many consecutive losses');
    }

    // Rapid portfolio decline
    const portfolioDecline = Math.abs(totalPnL) / portfolioValue;
    if (portfolioDecline > 0.3) { // 30% total portfolio loss
      emergencyConditions.push('Total portfolio loss exceeds 30%');
    }

    return {
      shouldStop: emergencyConditions.length > 0,
      reasons: emergencyConditions
    };
  }

  calculatePositionSize(confidence, riskScore, portfolioValue) {
    // Base size from confidence
    let baseSize = this.config.trading.maxPositionSize * confidence;
    
    // Adjust for risk
    const riskAdjustment = 1 - riskScore.overall;
    baseSize *= riskAdjustment;
    
    // Ensure within portfolio limits
    const maxPortfolioRisk = portfolioValue * (this.config.trading.riskPercentage / 100);
    baseSize = Math.min(baseSize, maxPortfolioRisk);
    
    // Minimum position size
    return Math.max(baseSize, 10); // Minimum $10 position
  }

  validateStopLoss(entryPrice, stopLoss) {
    const stopLossPercent = Math.abs(entryPrice - stopLoss) / entryPrice;
    
    return {
      isValid: stopLossPercent >= 0.02 && stopLossPercent <= 0.20, // 2-20%
      percentage: stopLossPercent * 100,
      recommendation: stopLossPercent < 0.02 ? 'Increase stop loss' : 
                     stopLossPercent > 0.20 ? 'Decrease stop loss' : 'Valid'
    };
  }

  calculatePortfolioValue(positions, walletBalance) {
    const solValue = (walletBalance.sol || 0) * 100; // Assume $100 per SOL for demo
    const tokenValue = positions.reduce((sum, pos) => sum + (pos.currentValue || pos.size), 0);
    return solValue + tokenValue;
  }

  calculateTokenConcentration(positions) {
    const tokenExposure = {};
    const totalValue = positions.reduce((sum, pos) => sum + pos.size, 0);
    
    for (const position of positions) {
      const symbol = position.token.symbol;
      tokenExposure[symbol] = (tokenExposure[symbol] || 0) + position.size;
    }
    
    // Convert to percentages
    for (const symbol in tokenExposure) {
      tokenExposure[symbol] = tokenExposure[symbol] / totalValue;
    }
    
    return tokenExposure;
  }

  areTokensSimilar(token1, token2) {
    // Simple similarity check based on symbol/name
    const symbol1 = (token1.symbol || '').toLowerCase();
    const symbol2 = (token2.symbol || '').toLowerCase();
    const name1 = (token1.name || '').toLowerCase();
    const name2 = (token2.name || '').toLowerCase();
    
    // Check for common words in memecoin names
    const commonWords = ['doge', 'shib', 'inu', 'moon', 'safe', 'baby'];
    
    for (const word of commonWords) {
      if ((symbol1.includes(word) || name1.includes(word)) && 
          (symbol2.includes(word) || name2.includes(word))) {
        return true;
      }
    }
    
    return false;
  }

  updateRiskMetrics(assessment) {
    this.riskMetrics.totalExposure = assessment.exposure;
    this.riskMetrics.lastRiskCheck = Date.now();
    
    if (assessment.riskLevel === 'HIGH') {
      this.logger.warn('🚨 High risk portfolio detected', assessment.warnings);
    }
  }

  getRiskReport() {
    return {
      metrics: this.riskMetrics,
      config: {
        maxPositionSize: this.config.trading.maxPositionSize,
        maxPortfolioRisk: this.config.trading.maxPortfolioRisk,
        stopLossPercentage: this.config.trading.stopLossPercentage,
        emergencyStopLoss: this.config.wallet.emergencyStopLoss
      },
      lastCheck: new Date(this.riskMetrics.lastRiskCheck).toISOString()
    };
  }
}

module.exports = RiskManager;
