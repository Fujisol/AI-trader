const { MongoClient } = require('mongodb');
const Logger = require('../utils/Logger');
let pg; // lazy import postgres lib only if needed

class Database {
  constructor() {
    this.logger = new Logger('Database');
    this.client = null;            // Mongo client
    this.db = null;                // Mongo db ref
    this.pg = null;                // Postgres client
    this.isPostgres = false;       // Flag to route calls
  }

  async connect() {
    try {
      const pgUrl = process.env.DATABASE_URL;
      if (pgUrl && /postgres/.test(pgUrl)) {
        try {
          if (!pg) pg = require('postgres');
          this.pg = pg(pgUrl, { prepare: true, max: 5, idle_timeout: 5 });
          await this._initPostgres();
          this.isPostgres = true;
          this.logger.info('✅ Connected to PostgreSQL (Supabase)');
          return;
        } catch (pgErr) {
          this.logger.warn('Postgres connection failed, falling back to MongoDB', pgErr);
        }
      }

      // Fallback to MongoDB (legacy) if no Postgres URL
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-crypto-trader';
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db();
      this.logger.info('✅ Connected to MongoDB');
      await this.createIndexes();
    } catch (error) {
      this.logger.error('Failed to connect to database layer:', error);
      throw error;
    }
  }

  async _initPostgres() {
    // Create tables if they do not exist (idempotent)
    await this.pg`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        ext_id VARCHAR(128),
        token TEXT,
        pnl NUMERIC,
        status TEXT,
        timestamp BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`;
    await this.pg`CREATE INDEX IF NOT EXISTS trades_timestamp_idx ON trades(timestamp DESC);`;

    await this.pg`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        token TEXT,
        data JSONB,
        timestamp BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`;
    await this.pg`CREATE INDEX IF NOT EXISTS market_data_timestamp_idx ON market_data(timestamp DESC);`;

    await this.pg`
      CREATE TABLE IF NOT EXISTS social_data (
        id SERIAL PRIMARY KEY,
        source TEXT,
        data JSONB,
        timestamp BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`;
    await this.pg`CREATE INDEX IF NOT EXISTS social_data_timestamp_idx ON social_data(timestamp DESC);`;
  }

  async createIndexes() {
    if (this.isPostgres) return; // Not needed
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
      if (this.isPostgres) {
        const ts = trade.timestamp || Date.now();
        const res = await this.pg`
          INSERT INTO trades (ext_id, token, pnl, status, timestamp)
          VALUES (${trade.id || null}, ${trade.token || null}, ${trade.pnl || 0}, ${trade.status || null}, ${ts})
          RETURNING id;`;
        return res[0].id;
      }
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
      if (this.isPostgres) {
        // Only update fields we know
        const fields = [];
        if (updates.status !== undefined) fields.push(this.pg`status = ${updates.status}`);
        if (updates.pnl !== undefined) fields.push(this.pg`pnl = ${updates.pnl}`);
        if (!fields.length) return false;
        await this.pg`UPDATE trades SET ${this.pg(fields)} WHERE id = ${tradeId}`;
        return true;
      }
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
      if (this.isPostgres) {
        const rows = await this.pg`SELECT * FROM trades ORDER BY timestamp DESC NULLS LAST LIMIT ${limit}`;
        return rows;
      }
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
      if (this.isPostgres) {
        await this.pg`INSERT INTO market_data (token, data, timestamp) VALUES (${data.token || null}, ${this.pg.json(data)}, ${data.timestamp || Date.now()})`;
        return;
      }
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
      if (this.isPostgres) {
        await this.pg`INSERT INTO social_data (source, data, timestamp) VALUES (${data.source || null}, ${this.pg.json(data)}, ${data.timestamp || Date.now()})`;
        return;
      }
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
      if (this.isPostgres) {
        const rows = await this.pg`
          SELECT
            COUNT(*)::int AS total_trades,
            COALESCE(SUM(pnl),0)::float AS total_pnl,
            SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END)::int AS winning_trades,
            SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END)::int AS losing_trades,
            COALESCE(AVG(pnl),0)::float AS avg_pnl,
            COALESCE(MAX(pnl),0)::float AS max_win,
            COALESCE(MIN(pnl),0)::float AS max_loss
          FROM trades;`;
        const r = rows[0];
        return {
          totalTrades: r.total_trades,
          totalPnL: r.total_pnl,
            winningTrades: r.winning_trades,
            losingTrades: r.losing_trades,
            avgPnL: r.avg_pnl,
            maxWin: r.max_win,
            maxLoss: r.max_loss
        };
      }
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
      if (this.isPostgres) {
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        const rows = await this.pg`
          SELECT to_char(to_timestamp(timestamp/1000),'YYYY-MM-DD') AS day,
                 SUM(pnl)::float AS daily_pnl,
                 COUNT(*)::int AS trade_count
          FROM trades
          WHERE timestamp >= ${since} AND status = 'closed'
          GROUP BY 1
          ORDER BY 1 ASC;`;
        return rows.map(r => ({ _id: r.day, dailyPnL: r.daily_pnl, tradeCount: r.trade_count }));
      }
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
    if (this.isPostgres && this.pg) {
      await this.pg.end({ timeout: 1 });
      this.logger.info('👋 Disconnected from PostgreSQL');
      return;
    }
    if (this.client) {
      await this.client.close();
      this.logger.info('👋 Disconnected from MongoDB');
    }
  }
}

module.exports = Database;
