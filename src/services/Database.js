const { MongoClient } = require('mongodb');
const Logger = require('../utils/Logger');

class Database {
  constructor() {
    this.logger = new Logger('Database');
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-crypto-trader';
      this.client = new MongoClient(uri);
      
      await this.client.connect();
      this.db = this.client.db();
      
      this.logger.info('✅ Connected to MongoDB');
      
      // Create indexes for better performance
      await this.createIndexes();
      
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Trades collection indexes
      await this.db.collection('trades').createIndex({ timestamp: -1 });
      await this.db.collection('trades').createIndex({ token: 1, timestamp: -1 });
      
      // Market data indexes
      await this.db.collection('market_data').createIndex({ timestamp: -1 });
      await this.db.collection('market_data').createIndex({ token: 1, timestamp: -1 });
      
      // Social data indexes
      await this.db.collection('social_data').createIndex({ timestamp: -1 });
      
      this.logger.info('📊 Database indexes created');
      
    } catch (error) {
      this.logger.error('Failed to create indexes:', error);
    }
  }

  async saveTrade(trade) {
    try {
      const result = await this.db.collection('trades').insertOne({
        ...trade,
        createdAt: new Date()
      });
      
      return result.insertedId;
    } catch (error) {
      this.logger.error('Failed to save trade:', error);
      throw error;
    }
  }

  async updateTrade(tradeId, updates) {
    try {
      const result = await this.db.collection('trades').updateOne(
        { _id: tradeId },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update trade:', error);
      throw error;
    }
  }

  async getTradeHistory(limit = 100) {
    try {
      const trades = await this.db.collection('trades')
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return trades;
    } catch (error) {
      this.logger.error('Failed to get trade history:', error);
      return [];
    }
  }

  async saveMarketData(data) {
    try {
      await this.db.collection('market_data').insertOne({
        ...data,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to save market data:', error);
    }
  }

  async saveSocialData(data) {
    try {
      await this.db.collection('social_data').insertOne({
        ...data,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to save social data:', error);
    }
  }

  async getPerformanceStats() {
    try {
      const stats = await this.db.collection('trades').aggregate([
        {
          $group: {
            _id: null,
            totalTrades: { $sum: 1 },
            totalPnL: { $sum: '$pnl' },
            winningTrades: {
              $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] }
            },
            losingTrades: {
              $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] }
            },
            avgPnL: { $avg: '$pnl' },
            maxWin: { $max: '$pnl' },
            maxLoss: { $min: '$pnl' }
          }
        }
      ]).toArray();
      
      return stats[0] || {
        totalTrades: 0,
        totalPnL: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgPnL: 0,
        maxWin: 0,
        maxLoss: 0
      };
    } catch (error) {
      this.logger.error('Failed to get performance stats:', error);
      return {};
    }
  }

  async getDailyPnL(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const dailyPnL = await this.db.collection('trades').aggregate([
        {
          $match: {
            timestamp: { $gte: startDate.getTime() },
            status: 'closed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $toDate: '$timestamp' }
              }
            },
            dailyPnL: { $sum: '$pnl' },
            tradeCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      return dailyPnL;
    } catch (error) {
      this.logger.error('Failed to get daily P&L:', error);
      return [];
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.logger.info('👋 Disconnected from MongoDB');
    }
  }
}

module.exports = Database;
