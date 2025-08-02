const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import agents
const MarketAnalysisAgent = require('./agents/MarketAnalysisAgent');
const TradingAgent = require('./agents/TradingAgent');
const SocialIntelligenceAgent = require('./agents/SocialIntelligenceAgent');
const WalletManager = require('./agents/WalletManager');
const CopyTradingAgent = require('./agents/CopyTradingAgent');

// Import services
const Logger = require('./utils/Logger');
const Database = require('./services/Database');
const AlertSystem = require('./services/AlertSystem');
const ScheduleManager = require('./services/ScheduleManager');
const PriceOracle = require('./services/PriceOracle');

// Import strategies
const MemeStrategy = require('./strategies/MemeStrategy');

// Import config
const config = require('./config/config');

// Import API routes
const APIRoutes = require('./api/routes');

class AITradingBot {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.logger = new Logger();
    this.database = new Database();
    this.alertSystem = new AlertSystem();
    this.priceOracle = new PriceOracle();
    
    // Initialize agents
    this.marketAgent = new MarketAnalysisAgent();
    this.tradingAgent = new TradingAgent();
    this.socialAgent = new SocialIntelligenceAgent();
    this.walletManager = new WalletManager();
    this.copyTradingAgent = new CopyTradingAgent();
    
    // Initialize strategies
    this.memeStrategy = new MemeStrategy(config);
    
    // Initialize services
    this.scheduleManager = new ScheduleManager({
      marketAgent: this.marketAgent,
      tradingAgent: this.tradingAgent,
      socialAgent: this.socialAgent,
      walletManager: this.walletManager,
      copyTradingAgent: this.copyTradingAgent
    });
    
    this.isRunning = false;
    this.startTime = null;
  }

  async initialize() {
    try {
      this.logger.info('🚀 Initializing AI Trading Bot...');
      
      // Setup middleware
      this.app.use(cors());
      this.app.use(express.json());
      
      // Connect to database
      await this.database.connect();
      
      // Initialize services
      await this.alertSystem.initialize();
      await this.priceOracle.initialize();
      
      // Initialize agents
      await this.marketAgent.initialize();
      await this.tradingAgent.initialize();
      await this.socialAgent.initialize();
      await this.walletManager.initialize();
      await this.copyTradingAgent.initialize();
      
      // Connect agents for enhanced functionality
      this.copyTradingAgent.setWalletManager(this.walletManager);
      this.marketAgent.connectSocialIntelligence(this.socialAgent);
      
      this.logger.info('🔗 Wallet Manager connected to Copy Trading Agent');
      this.logger.info('🔗 Social Intelligence connected to Market Analysis');
      
      // Initialize schedule manager
      this.scheduleManager.initialize();
      
      // Setup API routes
      this.setupRoutes();
      
      // Setup WebSocket connections
      this.setupWebSocket();
      
      this.logger.info('✅ AI Trading Bot initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize bot:', error);
      throw error;
    }
  }

  setupRoutes() {
    // Setup API routes
    const apiRoutes = new APIRoutes(this);
    this.app.use('/api', apiRoutes.getRouter());
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      this.logger.info('Dashboard connected');
      
      // Send initial data
      socket.emit('status', {
        isRunning: this.isRunning,
        walletBalance: this.walletManager.getBalance(),
        activePositions: this.tradingAgent.getActivePositions()
      });
      
      socket.on('disconnect', () => {
        this.logger.info('Dashboard disconnected');
      });
    });
  }

  async start() {
    if (this.isRunning) {
      this.logger.warn('Bot is already running');
      return;
    }

    this.logger.info('🎯 Starting AI Trading Bot...');
    this.isRunning = true;
    this.startTime = Date.now();

    // Start all agents
    await this.marketAgent.start();
    await this.socialAgent.start();
    await this.copyTradingAgent.start();
    
    // Start main trading loop
    this.startTradingLoop();
    
    this.logger.info('✅ AI Trading Bot started successfully');
  }

  async stop() {
    if (!this.isRunning) {
      this.logger.warn('Bot is already stopped');
      return;
    }

    this.logger.info('🛑 Stopping AI Trading Bot...');
    this.isRunning = false;

    // Stop all agents
    await this.marketAgent.stop();
    await this.socialAgent.stop();
    await this.copyTradingAgent.stop();
    
    this.logger.info('✅ AI Trading Bot stopped successfully');
  }

  startTradingLoop() {
    const tradingInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(tradingInterval);
        return;
      }

      try {
        // Get market analysis
        const marketData = await this.marketAgent.getAnalysis();
        
        // Get social sentiment
        const socialData = await this.socialAgent.getSentiment();
        
        // Execute trading decisions
        const tradingDecisions = await this.tradingAgent.analyzeTradingOpportunities(
          marketData,
          socialData
        );
        
        // Broadcast updates to dashboard
        this.io.emit('update', {
          timestamp: new Date().toISOString(),
          marketData,
          socialData,
          tradingDecisions,
          walletBalance: this.walletManager.getBalance(),
          activePositions: this.tradingAgent.getActivePositions()
        });
        
      } catch (error) {
        this.logger.error('Error in trading loop:', error);
      }
    }, 5000); // Run every 5 seconds
  }

  async shutdown() {
    this.logger.info('🔄 Shutting down AI Trading Bot...');
    
    if (this.isRunning) {
      await this.stop();
    }
    
    await this.database.disconnect();
    this.server.close();
    
    this.logger.info('👋 AI Trading Bot shutdown complete');
  }
}

// Start the bot
const bot = new AITradingBot();

bot.initialize().then(() => {
  const port = process.env.API_PORT || 8080;
  bot.server.listen(port, () => {
    console.log(`🚀 AI Trading Bot API running on port ${port}`);
    console.log(`📊 Dashboard available at http://localhost:3000`);
  });
}).catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await bot.shutdown();
  process.exit(0);
});

module.exports = AITradingBot;
