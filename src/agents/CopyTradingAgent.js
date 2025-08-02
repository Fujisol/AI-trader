const axios = require('axios');
const Logger = require('../utils/Logger');

class CopyTradingAgent {
  constructor() {
    this.logger = new Logger('CopyTradingAgent');
    this.isRunning = false;
    this.trackedTraders = [];
    this.recentTrades = [];
    this.profitableTraders = new Map();
  }

  async initialize() {
    this.logger.info('🔄 Initializing Copy Trading Agent...');
    
    // Initialize list of successful traders to track
    this.successfulTraders = [
      // Add known successful trader wallet addresses here
      // These would be discovered through on-chain analysis
    ];
    
    // Performance tracking
    this.performanceMetrics = {
      totalCopiedTrades: 0,
      successfulTrades: 0,
      totalPnL: 0
    };

    // For paper trading, add some demo profitable traders
    if (process.env.TRADING_MODE === 'paper') {
      this.addDemoTraders();
    }
    
    this.logger.info('✅ Copy Trading Agent initialized');
  }

  addDemoTraders() {
    // Add some demo successful traders for paper trading
    const demoTraders = [
      {
        wallet: 'DemoTrader1_HighSuccessRate',
        discoveredAt: Date.now(),
        totalProfit: 0.85,
        successRate: 0.78,
        copiedTrades: 0,
        lastActivity: Date.now()
      },
      {
        wallet: 'DemoTrader2_MemeSpecialist', 
        discoveredAt: Date.now(),
        totalProfit: 1.24,
        successRate: 0.65,
        copiedTrades: 0,
        lastActivity: Date.now()
      },
      {
        wallet: 'DemoTrader3_VolumeTrader',
        discoveredAt: Date.now(),
        totalProfit: 0.42,
        successRate: 0.72,
        copiedTrades: 0,
        lastActivity: Date.now()
      }
    ];

    for (const trader of demoTraders) {
      this.profitableTraders.set(trader.wallet, trader);
      this.logger.info(`✅ Added demo trader ${trader.wallet} (${(trader.successRate * 100).toFixed(1)}% success rate)`);
    }
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.logger.info('🎯 Starting copy trading monitoring...');
    
    this.startTraderDiscovery();
    this.startTradeMonitoring();
    
    // Listen for new trading signals from market analysis
    this.setupSignalListeners();
  }

  setupSignalListeners() {
    // Listen for new token opportunities
    process.on('tradingSignal', async (signal) => {
      if (signal.type === 'newTokenOpportunity') {
        await this.handleNewTokenSignal(signal);
      }
    });
    
    // Listen for copy trade signals from high-performance traders
    process.on('copyTradeSignal', async (signal) => {
      if (signal.type === 'copyTrade') {
        await this.handleCopyTradeSignal(signal);
      }
    });
    
    this.logger.info('📡 Signal listeners activated');
  }

  async handleNewTokenSignal(signal) {
    try {
      this.logger.info(`🔍 New token opportunity: ${signal.token} (${(signal.confidence * 100).toFixed(1)}% confidence)`);
      
      // Only trade if confidence is very high
      if (signal.confidence > 0.8) {
        await this.executeNewTokenTrade(signal);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle new token signal:', error.message);
    }
  }

  async handleCopyTradeSignal(signal) {
    try {
      this.logger.info(`🎯 Copy trade signal from ${signal.originalTrader}: ${signal.action} ${signal.token}`);
      
      // Execute copy trade if confidence is high
      if (signal.confidence > 0.75) {
        await this.executeCopyTrade(signal);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle copy trade signal:', error.message);
    }
  }

  async executeNewTokenTrade(signal) {
    try {
      if (!this.walletManager) {
        this.logger.warn('Wallet manager not connected');
        return;
      }
      
      const amountSOL = signal.suggestedAmount / 240; // Convert USD to SOL (assuming ~$240/SOL)
      
      this.logger.info(`🛒 Buying new token ${signal.token} with ${amountSOL.toFixed(4)} SOL`);
      
      const result = await this.walletManager.buyToken(signal.token, amountSOL);
      
      if (result.success) {
        this.performanceMetrics.totalCopiedTrades++;
        this.recentTrades.push({
          type: 'newTokenDiscovery',
          token: signal.token,
          amount: amountSOL,
          confidence: signal.confidence,
          reasons: signal.reasons,
          timestamp: Date.now(),
          txId: result.txId
        });
        
        this.logger.info(`✅ New token trade executed: ${signal.token}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to execute new token trade:', error.message);
    }
  }

  async executeCopyTrade(signal) {
    try {
      if (!this.walletManager) {
        this.logger.warn('Wallet manager not connected');
        return;
      }
      
      // Calculate trade size based on confidence and trader performance
      const baseAmount = 30; // Base $30 USD
      const adjustedAmount = baseAmount * signal.confidence * signal.traderWinRate;
      const amountSOL = adjustedAmount / 240; // Convert to SOL
      
      this.logger.info(`🔄 Copying trade from ${signal.originalTrader}: ${signal.action} ${signal.token}`);
      
      let result;
      if (signal.action === 'buy') {
        result = await this.walletManager.buyToken(signal.token, amountSOL);
      } else {
        // For sell signals, we'd need to check if we own the token
        this.logger.info('⏭️ Sell signal noted but not executed (need existing position)');
        return;
      }
      
      if (result && result.success) {
        this.performanceMetrics.totalCopiedTrades++;
        this.recentTrades.push({
          type: 'copyTrade',
          originalTrader: signal.originalTrader,
          token: signal.token,
          action: signal.action,
          amount: amountSOL,
          confidence: signal.confidence,
          traderWinRate: signal.traderWinRate,
          timestamp: Date.now(),
          txId: result.txId
        });
        
        this.logger.info(`✅ Copy trade executed: ${signal.token} from ${signal.originalTrader}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to execute copy trade:', error.message);
    }
  }

  async stop() {
    this.isRunning = false;
    this.logger.info('🛑 Copy trading monitoring stopped');
  }

  startTraderDiscovery() {
    // Discover successful traders every hour
    const discoveryInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(discoveryInterval);
        return;
      }
      
      try {
        await this.discoverProfitableTraders();
      } catch (error) {
        this.logger.error('Error in trader discovery:', error);
      }
    }, 3600000); // Every hour
  }

  startTradeMonitoring() {
    // Monitor tracked traders every 30 seconds
    const monitoringInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitoringInterval);
        return;
      }
      
      try {
        await this.monitorTrackedTraders();
      } catch (error) {
        this.logger.error('Error in trade monitoring:', error);
      }
    }, 30000); // Every 30 seconds
  }

  async discoverProfitableTraders() {
    try {
      this.logger.info('🔍 Discovering profitable traders...');
      
      // Method 1: Analyze top gainers' recent transactions
      const topGainers = await this.getTopGainers();
      await this.analyzeTopGainerTraders(topGainers);
      
      // Method 2: Look for wallets with high trading frequency and success
      await this.findHighVolumeTraders();
      
      // Method 3: Monitor DEX aggregators for large successful trades
      await this.monitorDEXAggregators();
      
    } catch (error) {
      this.logger.error('Failed to discover profitable traders:', error);
    }
  }

  async getTopGainers() {
    try {
      const response = await axios.get('https://public-api.birdeye.so/defi/tokenlist', {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY
        },
        params: {
          sort_by: 'price_change_24h_percent',
          sort_type: 'desc',
          limit: 20
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to get top gainers:', error);
      return [];
    }
  }

  async analyzeTopGainerTraders(tokens) {
    for (const token of tokens.slice(0, 5)) { // Limit to avoid rate limits
      try {
        // Get recent transactions for this token
        const transactions = await this.getTokenTransactions(token.address);
        
        // Analyze who bought early and made profits
        const earlyBuyers = this.identifyEarlyBuyers(transactions, token);
        
        // Add profitable traders to tracking list
        for (const buyer of earlyBuyers) {
          this.addTraderToTracking(buyer);
        }
        
      } catch (error) {
        this.logger.error(`Failed to analyze traders for ${token.symbol}:`, error);
      }
    }
  }

  async getTokenTransactions(tokenAddress) {
    try {
      // This would use Solana RPC or specialized APIs like Helius
      // For now, return mock data structure
      return [
        {
          signature: 'mock_signature',
          trader: 'mock_wallet_address',
          action: 'buy',
          amount: 1000,
          price: 0.001,
          timestamp: Date.now() - 86400000 // 24 hours ago
        }
      ];
    } catch (error) {
      this.logger.error('Failed to get token transactions:', error);
      return [];
    }
  }

  identifyEarlyBuyers(transactions, token) {
    const earlyBuyers = [];
    const currentPrice = token.price || 0;
    
    // Find traders who bought early and would have made significant profits
    for (const tx of transactions) {
      if (tx.action === 'buy' && tx.price < currentPrice * 0.5) {
        const profit = (currentPrice - tx.price) / tx.price;
        
        if (profit > 0.5) { // 50%+ profit
          earlyBuyers.push({
            wallet: tx.trader,
            buyPrice: tx.price,
            currentProfit: profit,
            timestamp: tx.timestamp
          });
        }
      }
    }
    
    return earlyBuyers;
  }

  async findHighVolumeTraders() {
    try {
      // This would analyze on-chain data to find wallets with:
      // 1. High trading frequency
      // 2. High success rate
      // 3. Consistent profits
      
      // Mock implementation
      const mockTraders = [
        {
          wallet: 'HighVolumeTrader1',
          dailyVolume: 50000,
          successRate: 0.75,
          avgProfit: 0.15
        }
      ];
      
      for (const trader of mockTraders) {
        this.addTraderToTracking(trader);
      }
      
    } catch (error) {
      this.logger.error('Failed to find high volume traders:', error);
    }
  }

  async monitorDEXAggregators() {
    try {
      // Monitor Jupiter, Raydium, etc. for large successful trades
      // This would track wallets that consistently make profitable large trades
      
      this.logger.info('📊 Monitoring DEX aggregators for successful trades...');
      
    } catch (error) {
      this.logger.error('Failed to monitor DEX aggregators:', error);
    }
  }

  addTraderToTracking(trader) {
    const walletAddress = trader.wallet;
    
    if (!this.profitableTraders.has(walletAddress)) {
      this.profitableTraders.set(walletAddress, {
        wallet: walletAddress,
        discoveredAt: Date.now(),
        totalProfit: trader.currentProfit || 0,
        successRate: trader.successRate || 0,
        copiedTrades: 0,
        lastActivity: Date.now()
      });
      
      this.logger.info(`✅ Added trader ${walletAddress} to tracking list`);
    }
  }

  async monitorTrackedTraders() {
    const traders = Array.from(this.profitableTraders.values()).slice(0, 10); // Limit monitoring
    
    for (const trader of traders) {
      try {
        const recentTrades = await this.getTraderRecentTrades(trader.wallet);
        
        for (const trade of recentTrades) {
          if (this.shouldCopyTrade(trade, trader)) {
            await this.copyTrade(trade, trader);
          }
        }
        
      } catch (error) {
        this.logger.error(`Failed to monitor trader ${trader.wallet}:`, error);
      }
    }
  }

  async getTraderRecentTrades(walletAddress) {
    try {
      // Get recent transactions for the wallet
      // This would use Solana RPC or specialized APIs
      
      if (process.env.TRADING_MODE === 'paper') {
        // Generate realistic mock trades for demo traders
        return this.generateDemoTrades(walletAddress);
      }
      
      // For live trading, this would use real blockchain data
      return [];
      
    } catch (error) {
      this.logger.error('Failed to get trader recent trades:', error);
      return [];
    }
  }

  generateDemoTrades(walletAddress) {
    // Generate 1-3 random trades for demo purposes
    const tradeCount = Math.floor(Math.random() * 3) + 1;
    const trades = [];

    for (let i = 0; i < tradeCount; i++) {
      // Increased chance of generating a trade (60% chance for more activity)
      if (Math.random() < 0.6) {
        const mockTokens = [
          'BONK', 'WIF', 'POPCAT', 'MEW', 'BOME',
          'SLERF', 'MYRO', 'BOOK', 'ZEUS', 'HARAMBE',
          'PEPE', 'FLOKI', 'SHIB', 'DOGE', 'TRUMP'
        ];
        
        const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
        const amount = Math.floor(Math.random() * 500) + 50; // 50-550 USD
        const action = Math.random() > 0.8 ? 'sell' : 'buy'; // 80% buy, 20% sell

        trades.push({
          signature: `demo_${walletAddress}_${Date.now()}_${i}`,
          action: action,
          token: token,
          amount: amount,
          price: 0.001 + Math.random() * 0.01, // Random price
          timestamp: Date.now() - Math.floor(Math.random() * 300000) // Last 5 minutes
        });

        this.logger.info(`📊 Generated demo trade: ${walletAddress.slice(0, 12)}... ${action} ${amount} ${token}`);
      }
    }

    return trades;
  }

  shouldCopyTrade(trade, trader) {
    // Copy trade criteria - more relaxed for paper trading
    const isPaperMode = process.env.TRADING_MODE === 'paper';
    
    const criteria = {
      // Only copy recent trades (within 5 minutes)
      isRecent: Date.now() - trade.timestamp < 300000,
      
      // Only copy buy orders for now  
      isBuyOrder: trade.action === 'buy',
      
      // Trader has good track record (lower threshold for demo)
      goodTrader: trader.successRate > (isPaperMode ? 0.5 : 0.6),
      
      // Trade size is reasonable (wider range for demo)
      reasonableSize: trade.amount > (isPaperMode ? 5 : 10) && trade.amount < (isPaperMode ? 2000 : 1000),
      
      // Haven't copied this exact trade already
      notAlreadyCopied: !this.recentTrades.some(t => t.signature === trade.signature)
    };
    
    const shouldCopy = Object.values(criteria).every(c => c);
    
    if (shouldCopy) {
      this.logger.info(`🎯 Copy trade signal: ${trade.action} ${trade.token} ($${trade.amount}) from ${trader.wallet.slice(0, 12)}...`);
    } else if (isPaperMode) {
      // In paper mode, show why trades are rejected for learning
      const failedCriteria = Object.entries(criteria)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (failedCriteria.length > 0) {
        this.logger.info(`⏭️ Trade skipped (${failedCriteria.join(', ')}): ${trade.action} ${trade.token}`);
      }
    }
    
    return shouldCopy;
  }

  async copyTrade(trade, trader) {
    try {
      this.logger.info(`🔄 Copying trade from ${trader.wallet}: ${trade.action} ${trade.token}`);
      
      // Calculate copy size (smaller than original)
      const copySize = Math.min(trade.amount * 0.1, 50); // 10% of original, max $50
      const copySizeSOL = copySize / 240; // Assume ~$240 per SOL for demo
      
      // Create copy trade signal
      const copyTradeSignal = {
        originalTrader: trader.wallet,
        action: trade.action,
        token: trade.token,
        originalAmount: trade.amount,
        copyAmount: copySize,
        copySizeSOL: copySizeSOL,
        originalPrice: trade.price,
        timestamp: Date.now(),
        reason: `Copy trade from successful trader ${trader.wallet.slice(0, 8)}...`
      };

      // Execute the actual trade if we have access to wallet manager
      if (this.walletManager) {
        try {
          const tradeResult = await this.walletManager.buyToken(trade.token, copySizeSOL);
          copyTradeSignal.executed = true;
          copyTradeSignal.txId = tradeResult.txId;
          copyTradeSignal.tokensReceived = tradeResult.amountOut;
          copyTradeSignal.executionPrice = tradeResult.tokenPrice;
          
          this.logger.info(`✅ Copy trade executed: ${tradeResult.amountOut?.toFixed(2)} ${trade.token} for ${copySizeSOL.toFixed(4)} SOL`);
        } catch (error) {
          copyTradeSignal.executed = false;
          copyTradeSignal.error = error.message;
          this.logger.error(`❌ Failed to execute copy trade: ${error.message}`);
        }
      }
      
      // Add to recent trades to avoid duplicates
      this.recentTrades.push({
        signature: trade.signature,
        timestamp: Date.now(),
        copyTradeSignal: copyTradeSignal
      });
      
      // Clean old trades (keep only last 100)
      if (this.recentTrades.length > 100) {
        this.recentTrades = this.recentTrades.slice(-100);
      }
      
      // Update performance metrics
      this.performanceMetrics.totalCopiedTrades++;
      trader.copiedTrades++;
      
      this.logger.info(`✅ Copy trade signal created for ${copySize} USD (${copySizeSOL.toFixed(4)} SOL)`);
      
      return copyTradeSignal;
      
    } catch (error) {
      this.logger.error('Failed to copy trade:', error);
      return null;
    }
  }

  // Add method to set wallet manager reference
  setWalletManager(walletManager) {
    this.walletManager = walletManager;
    this.logger.info('🔗 Wallet Manager connected to Copy Trading Agent');
  }

  getCopyTradingStats() {
    return {
      trackedTraders: this.profitableTraders.size,
      totalCopiedTrades: this.performanceMetrics.totalCopiedTrades,
      successfulTrades: this.performanceMetrics.successfulTrades,
      totalPnL: this.performanceMetrics.totalPnL,
      recentTrades: this.recentTrades.length
    };
  }

  getTopTraders(limit = 10) {
    return Array.from(this.profitableTraders.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  updateTraderPerformance(walletAddress, tradeResult) {
    const trader = this.profitableTraders.get(walletAddress);
    if (trader) {
      if (tradeResult.profit > 0) {
        this.performanceMetrics.successfulTrades++;
      }
      
      this.performanceMetrics.totalPnL += tradeResult.profit;
      trader.totalProfit += tradeResult.profit;
      trader.lastActivity = Date.now();
      
      // Recalculate success rate
      trader.successRate = this.performanceMetrics.successfulTrades / this.performanceMetrics.totalCopiedTrades;
    }
  }

  // Clean up inactive traders
  cleanupInactiveTraders() {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    for (const [wallet, trader] of this.profitableTraders.entries()) {
      if (trader.lastActivity < weekAgo) {
        this.profitableTraders.delete(wallet);
        this.logger.info(`🧹 Removed inactive trader ${wallet}`);
      }
    }
  }
}

module.exports = CopyTradingAgent;
