const cron = require('node-cron');
const Logger = require('../utils/Logger');

class ScheduleManager {
  constructor(agents) {
    this.logger = new Logger('ScheduleManager');
    this.agents = agents;
    this.jobs = [];
  }

  initialize() {
    this.logger.info('⏰ Initializing Schedule Manager...');
    
    // Market analysis every 30 seconds
    this.scheduleJob('*/30 * * * * *', () => {
      this.agents.marketAgent.updateMarketData();
    }, 'Market Analysis');

    // Social monitoring every minute
    this.scheduleJob('0 * * * * *', () => {
      this.agents.socialAgent.monitorTwitterTrends();
    }, 'Social Monitoring');

    // Portfolio rebalancing every hour
    this.scheduleJob('0 0 * * * *', () => {
      this.rebalancePortfolio();
    }, 'Portfolio Rebalancing');

    // Daily cleanup at midnight
    this.scheduleJob('0 0 0 * * *', () => {
      this.dailyCleanup();
    }, 'Daily Cleanup');

    // Risk assessment every 5 minutes
    this.scheduleJob('0 */5 * * * *', () => {
      this.assessRisk();
    }, 'Risk Assessment');

    this.logger.info(`✅ Schedule Manager initialized with ${this.jobs.length} jobs`);
  }

  scheduleJob(schedule, task, name) {
    const job = cron.schedule(schedule, async () => {
      try {
        await task();
      } catch (error) {
        this.logger.error(`Error in scheduled job ${name}:`, error);
      }
    });

    this.jobs.push({ name, schedule, job });
    this.logger.info(`📅 Scheduled job: ${name} (${schedule})`);
  }

  async rebalancePortfolio() {
    this.logger.info('🔄 Running portfolio rebalancing...');
    
    try {
      const balance = this.agents.walletManager.getBalance();
      const activePositions = this.agents.tradingAgent.getActivePositions();
      
      // Check if portfolio is overexposed to any single token
      const exposureMap = new Map();
      
      for (const position of activePositions) {
        const tokenSymbol = position.token.symbol;
        const currentExposure = exposureMap.get(tokenSymbol) || 0;
        exposureMap.set(tokenSymbol, currentExposure + position.size);
      }
      
      // Close positions that are overexposed (>20% of portfolio)
      const totalPortfolioValue = this.agents.walletManager.getPortfolioValue();
      
      for (const [symbol, exposure] of exposureMap.entries()) {
        const exposurePercentage = exposure / totalPortfolioValue;
        
        if (exposurePercentage > 0.2) {
          this.logger.warn(`⚠️ Overexposed to ${symbol}: ${(exposurePercentage * 100).toFixed(1)}%`);
          
          // Find and reduce positions for this token
          const overexposedPositions = activePositions.filter(p => p.token.symbol === symbol);
          for (const position of overexposedPositions.slice(0, Math.ceil(overexposedPositions.length / 2))) {
            await this.agents.tradingAgent.closePosition(position);
          }
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to rebalance portfolio:', error);
    }
  }

  async dailyCleanup() {
    this.logger.info('🧹 Running daily cleanup...');
    
    try {
      // Clean up old data
      this.agents.copyTradingAgent.cleanupInactiveTraders();
      
      // Reset daily counters
      this.agents.tradingAgent.dailyPnL = 0;
      
      // Log daily summary
      const summary = await this.generateDailySummary();
      this.logger.info('📊 Daily Summary:', summary);
      
    } catch (error) {
      this.logger.error('Failed to run daily cleanup:', error);
    }
  }

  async assessRisk() {
    try {
      const activePositions = this.agents.tradingAgent.getActivePositions();
      const totalValue = this.agents.walletManager.getPortfolioValue();
      
      // Check overall risk exposure
      const totalPositionValue = activePositions.reduce((sum, pos) => sum + pos.size, 0);
      const riskExposure = totalPositionValue / totalValue;
      
      if (riskExposure > 0.8) {
        this.logger.warn(`⚠️ High risk exposure: ${(riskExposure * 100).toFixed(1)}%`);
        
        // Reduce position sizes
        for (const position of activePositions.slice(0, 2)) {
          await this.agents.tradingAgent.closePosition(position);
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to assess risk:', error);
    }
  }

  async generateDailySummary() {
    const tradingAgent = this.agents.tradingAgent;
    const walletManager = this.agents.walletManager;
    
    return {
      dailyPnL: tradingAgent.getDailyPnL(),
      totalPnL: tradingAgent.getTotalPnL(),
      activePositions: tradingAgent.getActivePositions().length,
      walletBalance: walletManager.getBalance().sol,
      totalTrades: tradingAgent.getTradingHistory().length
    };
  }

  stop() {
    this.logger.info('🛑 Stopping scheduled jobs...');
    
    for (const job of this.jobs) {
      job.job.stop();
    }
    
    this.logger.info('✅ All scheduled jobs stopped');
  }
}

module.exports = ScheduleManager;
