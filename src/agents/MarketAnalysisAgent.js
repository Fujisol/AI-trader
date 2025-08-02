const axios = require('axios');
const { SMA, RSI, MACD } = require('technicalindicators');
const Logger = require('../utils/Logger');

class MarketAnalysisAgent {
  constructor() {
    this.logger = new Logger('MarketAnalysisAgent');
    this.isRunning = false;
    this.marketData = {
      prices: {},
      volumes: {},
      trends: {},
      patterns: {}
    };
    this.discoveredTokens = new Map();
    this.highPerformanceTraders = new Map();
    this.lastTokenScan = 0;
    this.lastTraderScan = 0;
  }

  async initialize() {
    this.logger.info('🔍 Initializing Market Analysis Agent...');
    
    // Initialize price feeds and analysis tools
    this.priceFeeds = [
      'https://api.coingecko.com/api/v3',
      'https://api.binance.com/api/v3',
      process.env.BIRDEYE_API_URL
    ];
    
    this.logger.info('✅ Market Analysis Agent initialized');
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.logger.info('🎯 Starting market analysis...');
    
    // Start continuous market monitoring
    this.startMarketMonitoring();
  }

  async stop() {
    this.isRunning = false;
    this.logger.info('🛑 Market analysis stopped');
  }

  startMarketMonitoring() {
    // Monitor major cryptocurrencies
    const monitoringInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitoringInterval);
        return;
      }
      
      try {
        await this.updateMarketData();
        await this.analyzePatterns();
        await this.detectOpportunities();
        
        // NEW: Enhanced token discovery and trader analysis
        await this.discoverNewTokens();
        await this.discoverHighPerformanceTraders();
        
      } catch (error) {
        this.logger.error('Error in market monitoring:', error);
      }
    }, 10000); // Update every 10 seconds
  }

  async updateMarketData() {
    try {
      // Fetch market data with proper error handling
      const results = await Promise.allSettled([
        this.fetchSolanaTokens(),
        this.fetchTopGainers(),
        this.fetchNewListings()
      ]);

      const [solanaTokens, topGainers, newListings] = results.map(result => 
        result.status === 'fulfilled' ? result.value : []
      );
      
      this.marketData = {
        ...this.marketData,
        solanaTokens,
        topGainers,
        newListings,
        timestamp: Date.now()
      };

      // Log successful updates
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      if (successCount > 0) {
        this.logger.info(`📊 Market data updated: ${successCount}/3 sources successful`);
      }
      
    } catch (error) {
      this.logger.error('Failed to update market data:', error.message);
    }
  }

  async fetchSolanaTokens() {
    try {
      // Check if Birdeye API key is configured
      if (!process.env.BIRDEYE_API_KEY || process.env.BIRDEYE_API_KEY === 'your_birdeye_api_key_here') {
        this.logger.warn('⚠️ Birdeye API key not configured, using fallback data');
        return [];
      }

      // Fetch trending Solana tokens from Birdeye API
      const response = await axios.get('https://public-api.birdeye.so/defi/tokenlist', {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY
        },
        params: {
          sort_by: 'v24hUSD',
          sort_type: 'desc',
          limit: 50
        },
        timeout: 10000
      });
      
      this.logger.info(`🐦 Fetched ${response.data.data?.length || 0} Solana tokens`);
      return response.data.data || [];
    } catch (error) {
      if (error.response?.status === 401) {
        this.logger.error('🔑 Birdeye API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        this.logger.warn('⚠️ Birdeye API rate limit exceeded');
      } else {
        this.logger.error('Failed to fetch Solana tokens:', error.message);
      }
      return [];
    }
  }

  async fetchTopGainers() {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'percent_change_24h_desc',
          per_page: 50,
          page: 1,
          sparkline: false,
          category: 'solana-ecosystem'
        },
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const gainers = response.data.filter(coin => 
        coin.price_change_percentage_24h > 5 && 
        coin.market_cap > 50000
      );

      this.logger.info(`📈 Found ${gainers.length} top gainers`);
      return gainers;
    } catch (error) {
      if (error.response?.status === 429) {
        this.logger.warn('⚠️ CoinGecko API rate limit exceeded');
      } else {
        this.logger.error('Failed to fetch top gainers:', error.message);
      }
      return [];
    }
  }

  async fetchNewListings() {
    try {
      // Check if Birdeye API key is configured
      if (!process.env.BIRDEYE_API_KEY || process.env.BIRDEYE_API_KEY === 'your_birdeye_api_key_here') {
        this.logger.warn('⚠️ Birdeye API key not configured for new listings');
        return this.generateMockNewListings();
      }

      // Fetch recently listed tokens (last 24h)
      const response = await axios.get('https://public-api.birdeye.so/defi/token_creation_time', {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY
        },
        params: {
          limit: 20,
          sort_type: 'desc'
        },
        timeout: 10000
      });
      
      const recentTokens = response.data.data || [];
      this.logger.info(`🆕 Found ${recentTokens.length} new token listings`);
      return recentTokens;
    } catch (error) {
      if (error.response?.status === 401) {
        this.logger.error('🔑 Birdeye API authentication failed for new listings');
      } else {
        this.logger.error('Failed to fetch new listings:', error.message);
      }
      return this.generateMockNewListings();
    }
  }

  generateMockNewListings() {
    // Generate mock data for testing when APIs are not available
    return [
      {
        symbol: 'MOCK1',
        name: 'Mock Token 1',
        price_change_24h: 15.5,
        volume_24h: 50000,
        market_cap: 1000000,
        created_time: Date.now() - 3600000 // 1 hour ago
      },
      {
        symbol: 'MOCK2', 
        name: 'Mock Token 2',
        price_change_24h: -5.2,
        volume_24h: 25000,
        market_cap: 500000,
        created_time: Date.now() - 7200000 // 2 hours ago
      }
    ];
  }

  async analyzePatterns() {
    try {
      const patterns = {};
      
      // Analyze each token for patterns
      for (const token of this.marketData.topGainers || []) {
        const priceHistory = await this.getPriceHistory(token.id);
        
        if (priceHistory.length > 20) {
          patterns[token.id] = {
            rsi: this.calculateRSI(priceHistory),
            macd: this.calculateMACD(priceHistory),
            support: this.findSupport(priceHistory),
            resistance: this.findResistance(priceHistory),
            trend: this.identifyTrend(priceHistory),
            volumeAnalysis: this.analyzeVolume(token)
          };
        }
      }
      
      this.marketData.patterns = patterns;
    } catch (error) {
      this.logger.error('Failed to analyze patterns:', error);
    }
  }

  async getPriceHistory(tokenId) {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: '7',
          interval: 'hourly'
        }
      });
      
      return response.data.prices.map(([timestamp, price]) => price);
    } catch (error) {
      this.logger.error(`Failed to get price history for ${tokenId}:`, error);
      return [];
    }
  }

  calculateRSI(prices) {
    if (prices.length < 14) return null;
    
    const rsi = RSI.calculate({
      values: prices,
      period: 14
    });
    
    return rsi[rsi.length - 1];
  }

  calculateMACD(prices) {
    if (prices.length < 26) return null;
    
    const macd = MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    return macd[macd.length - 1];
  }

  findSupport(prices) {
    // Simple support level calculation
    const recentPrices = prices.slice(-20);
    return Math.min(...recentPrices);
  }

  findResistance(prices) {
    // Simple resistance level calculation
    const recentPrices = prices.slice(-20);
    return Math.max(...recentPrices);
  }

  identifyTrend(prices) {
    if (prices.length < 10) return 'unknown';
    
    const recent = prices.slice(-10);
    const older = prices.slice(-20, -10);
    
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;
    
    if (recentAvg > olderAvg * 1.05) return 'bullish';
    if (recentAvg < olderAvg * 0.95) return 'bearish';
    return 'sideways';
  }

  analyzeVolume(token) {
    return {
      volume24h: token.total_volume,
      volumeChange: token.volume_change_24h,
      isHighVolume: token.total_volume > token.market_cap * 0.1
    };
  }

  async detectOpportunities() {
    const opportunities = [];
    
    try {
      // Look for memecoin opportunities
      const memecoins = await this.identifyMemecoins();
      
      for (const coin of memecoins) {
        const pattern = this.marketData.patterns[coin.id];
        
        if (pattern && this.isGoodEntry(pattern, coin)) {
          opportunities.push({
            type: 'memecoin',
            token: coin,
            confidence: this.calculateConfidence(pattern, coin),
            entry: coin.current_price,
            stopLoss: pattern.support * 0.95,
            takeProfit: pattern.resistance * 1.1,
            timestamp: Date.now()
          });
        }
      }
      
      this.marketData.opportunities = opportunities;
      
      if (opportunities.length > 0) {
        this.logger.info(`🎯 Found ${opportunities.length} trading opportunities`);
      }
      
    } catch (error) {
      this.logger.error('Failed to detect opportunities:', error);
    }
  }

  async identifyMemecoins() {
    // Filter tokens that could be memecoins based on various criteria
    return (this.marketData.topGainers || []).filter(token => {
      const name = token.name.toLowerCase();
      const symbol = token.symbol.toLowerCase();
      
      // Common memecoin patterns
      const memeKeywords = ['doge', 'shib', 'pepe', 'wojak', 'chad', 'moon', 'rocket', 'inu', 'cat', 'frog'];
      const hasMemeKeyword = memeKeywords.some(keyword => 
        name.includes(keyword) || symbol.includes(keyword)
      );
      
      // Check if it's a new token with high volatility
      const isHighVolatility = Math.abs(token.price_change_percentage_24h) > 20;
      const hasReasonableMarketCap = token.market_cap > 10000 && token.market_cap < 10000000;
      
      return (hasMemeKeyword || isHighVolatility) && hasReasonableMarketCap;
    });
  }

  isGoodEntry(pattern, coin) {
    if (!pattern) return false;
    
    // Entry criteria
    const rsiOversold = pattern.rsi && pattern.rsi < 30;
    const rsiOverbought = pattern.rsi && pattern.rsi > 70;
    const bullishTrend = pattern.trend === 'bullish';
    const highVolume = pattern.volumeAnalysis.isHighVolume;
    const priceNearSupport = coin.current_price < pattern.support * 1.05;
    
    // Good entry for long position
    return (rsiOversold || (bullishTrend && priceNearSupport)) && highVolume;
  }

  calculateConfidence(pattern, coin) {
    let confidence = 0;
    
    // RSI signals
    if (pattern.rsi < 30) confidence += 0.3;
    if (pattern.rsi > 70) confidence += 0.2;
    
    // Trend signals
    if (pattern.trend === 'bullish') confidence += 0.2;
    
    // Volume signals
    if (pattern.volumeAnalysis.isHighVolume) confidence += 0.2;
    
    // Price action
    if (coin.price_change_percentage_24h > 10) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  async getAnalysis() {
    return {
      marketData: this.marketData,
      timestamp: Date.now(),
      summary: {
        totalTokensAnalyzed: this.marketData.topGainers?.length || 0,
        opportunitiesFound: this.marketData.opportunities?.length || 0,
        avgConfidence: this.calculateAverageConfidence()
      }
    };
  }

  calculateAverageConfidence() {
    const opportunities = this.marketData.opportunities || [];
    if (opportunities.length === 0) return 0;
    
    const totalConfidence = opportunities.reduce((sum, opp) => sum + opp.confidence, 0);
    return totalConfidence / opportunities.length;
  }

  // ===== NEW ENHANCED TOKEN DISCOVERY =====

  async discoverNewTokens() {
    try {
      const now = Date.now();
      // Scan every 2 minutes for demo (instead of 10 minutes)
      if (now - this.lastTokenScan < 2 * 60 * 1000) return;
      
      this.logger.info('🔍 Scanning for new potential tokens...');
      
      const [birdeyeTokens, jupiterTokens] = await Promise.allSettled([
        this.scanBirdeyeNewTokens(),
        this.scanJupiterTrendingTokens()
      ]);
      
      const allNewTokens = [
        ...(birdeyeTokens.status === 'fulfilled' ? birdeyeTokens.value : []),
        ...(jupiterTokens.status === 'fulfilled' ? jupiterTokens.value : [])
      ];
      
      // Analyze each token's potential
      for (const token of allNewTokens) {
        await this.analyzeTokenPotential(token);
      }
      
      this.lastTokenScan = now;
      this.logger.info(`💎 Discovered ${allNewTokens.length} new tokens for analysis`);
      
    } catch (error) {
      this.logger.error('Failed to discover new tokens:', error.message);
    }
  }

  async scanBirdeyeNewTokens() {
    try {
      const response = await axios.get(`https://public-api.birdeye.so/defi/tokenlist`, {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY
        },
        params: {
          sort_by: 'v24hUSD',
          sort_type: 'desc',
          offset: 0,
          limit: 50
        },
        timeout: 10000
      });
      
      return response.data.data?.tokens?.filter(token => 
        token.v24hUSD > 100000 && // Min 100k volume
        token.mc > 1000000 && // Min 1M market cap
        !this.discoveredTokens.has(token.address)
      ) || [];
      
    } catch (error) {
      this.logger.warn('Failed to fetch Birdeye tokens, using DexScreener fallback:', error.message);
      return await this.scanDexScreenerTokens();
    }
  }

  async scanDexScreenerTokens() {
    try {
      const response = await axios.get(`https://${process.env.DEXSCREENER_API_URL}/latest/dex/tokens/solana`, {
        timeout: 10000
      });
      
      return response.data.pairs?.filter(pair => 
        pair.volume.h24 > 50000 && // Min 50k volume
        pair.fdv > 1000000 && // Min 1M FDV
        !this.discoveredTokens.has(pair.baseToken.address)
      ).map(pair => ({
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        v24hUSD: pair.volume.h24,
        mc: pair.fdv,
        priceChange24h: pair.priceChange.h24
      })).slice(0, 30) || [];
      
    } catch (error) {
      this.logger.warn('DexScreener fallback failed:', error.message);
      return [];
    }
  }

  async scanJupiterTrendingTokens() {
    try {
      // Use Jupiter token list API
      const response = await axios.get(`https://${process.env.JUPITER_TOKEN_LIST_URL}/strict`, {
        timeout: 10000
      });
      
      // Get tokens and add mock volume data for trending analysis
      const tokens = response.data?.filter(token => 
        token.name && token.symbol && 
        !this.discoveredTokens.has(token.address)
      ).map(token => ({
        ...token,
        volume24h: Math.random() * 1000000, // Mock volume for demo
        priceChange24h: (Math.random() - 0.5) * 20
      })).filter(token => 
        token.volume24h > 50000 // Filter by volume
      ).slice(0, 30);
      
      return tokens;
      
    } catch (error) {
      this.logger.warn('Failed to fetch Jupiter tokens:', error.message);
      // Fallback to Jupiter price API
      return await this.scanJupiterPriceAPI();
    }
  }

  async scanJupiterPriceAPI() {
    try {
      const response = await axios.get(`https://${process.env.JUPITER_PRICE_API_URL}/v4/price?ids=SOL,BONK,WIF,PEPE,JUP,PYTH`, {
        timeout: 10000
      });
      
      return Object.entries(response.data.data || {}).map(([id, data]) => ({
        address: id,
        symbol: id,
        name: id,
        volume24h: Math.random() * 500000,
        price: data.price,
        priceChange24h: (Math.random() - 0.3) * 15
      }));
      
    } catch (error) {
      this.logger.warn('Jupiter price API fallback failed:', error.message);
      return [];
    }
  }

  async analyzeTokenPotential(token) {
    try {
      let potentialScore = 0;
      const analysis = {
        token: token.symbol || token.name,
        address: token.address,
        reasons: [],
        twitterSentiment: null,
        traderActivity: null
      };
      
      // 1. Volume analysis
      if (token.v24hUSD > 500000 || token.volume24h > 500000) {
        potentialScore += 0.3;
        analysis.reasons.push('High 24h volume');
      }
      
      // 2. Market cap analysis
      if (token.mc && token.mc > 5000000 && token.mc < 100000000) {
        potentialScore += 0.2;
        analysis.reasons.push('Good market cap range');
      }
      
      // 3. Check Twitter sentiment
      const twitterScore = await this.checkTwitterSentiment(token.symbol || token.name);
      if (twitterScore > 0.6) {
        potentialScore += 0.3;
        analysis.twitterSentiment = twitterScore;
        analysis.reasons.push('Strong Twitter buzz');
      }
      
      // 4. Check if high-performance traders are trading it
      const traderActivity = await this.checkHighPerformanceTraderActivity(token.address);
      if (traderActivity.score > 0.7) {
        potentialScore += 0.4;
        analysis.traderActivity = traderActivity;
        analysis.reasons.push('High-performance traders active');
      }
      
      // Store token if it has potential
      if (potentialScore > 0.6) {
        this.discoveredTokens.set(token.address, {
          ...analysis,
          potentialScore,
          discoveredAt: Date.now()
        });
        
        this.logger.info(`🚀 High potential token found: ${analysis.token} (Score: ${potentialScore.toFixed(2)})`);
        
        // Emit trading signal if score is very high
        if (potentialScore > 0.8) {
          this.emitTradingSignal(token, analysis, potentialScore);
        }
      }
      
    } catch (error) {
      this.logger.warn(`Failed to analyze token potential:`, error.message);
    }
  }

  async checkTwitterSentiment(tokenSymbol) {
    try {
      // Use the enhanced social intelligence agent if available
      if (this.socialIntelligenceAgent) {
        return await this.socialIntelligenceAgent.getTokenSentimentScore(tokenSymbol);
      }
      
      // Fallback simulation
      const mentionCount = Math.random() * 1000;
      const sentimentScore = Math.random();
      
      // High mentions + positive sentiment = high score
      return (mentionCount > 100 ? 0.4 : mentionCount / 250) + sentimentScore * 0.6;
      
    } catch (error) {
      return 0;
    }
  }

  // Connect social intelligence agent for enhanced sentiment analysis
  connectSocialIntelligence(socialAgent) {
    this.socialIntelligenceAgent = socialAgent;
    this.logger.info('🔗 Social Intelligence connected to Market Analysis');
  }

  // ===== HIGH-PERFORMANCE TRADER DISCOVERY =====

  async discoverHighPerformanceTraders() {
    try {
      const now = Date.now();
      // Scan every 5 minutes for demo (instead of 30 minutes)
      if (now - this.lastTraderScan < 5 * 60 * 1000) return;
      
      this.logger.info('🎯 Scanning for high-performance traders...');
      
      const traders = await this.scanSolanaHighPerformanceTraders();
      
      for (const trader of traders) {
        if (trader.winRate >= 0.8 && trader.trades3Months >= 20) {
          await this.analyzeTraderPerformance(trader);
        }
      }
      
      this.lastTraderScan = now;
      this.logger.info(`📈 Found ${traders.length} high-performance traders`);
      
    } catch (error) {
      this.logger.error('Failed to discover traders:', error.message);
    }
  }

  async scanSolanaHighPerformanceTraders() {
    try {
      // This would integrate with Solana analytics APIs to find top traders
      // For now, simulate some high-performance traders
      const simulatedTraders = [
        {
          address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          winRate: 0.92,
          trades3Months: 156,
          totalPnL: 89500,
          avgTradeSize: 2.3,
          lastActive: Date.now() - 2 * 60 * 1000
        },
        {
          address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC7LZ7WVQnMZtG',
          winRate: 0.87,
          trades3Months: 203,
          totalPnL: 156700,
          avgTradeSize: 1.8,
          lastActive: Date.now() - 15 * 60 * 1000
        },
        {
          address: 'B8BsjVmTJQPNTKYbz3CzfQgN6B2PmP7xQjYYG8mWJKvM',
          winRate: 0.84,
          trades3Months: 89,
          totalPnL: 45300,
          avgTradeSize: 3.1,
          lastActive: Date.now() - 5 * 60 * 1000
        }
      ];
      
      return simulatedTraders;
      
    } catch (error) {
      this.logger.warn('Failed to scan traders:', error.message);
      return [];
    }
  }

  async analyzeTraderPerformance(trader) {
    try {
      // Check if trader is active (traded in last hour)
      const isActive = Date.now() - trader.lastActive < 60 * 60 * 1000;
      
      if (!isActive) return;
      
      // Get recent trades
      const recentTrades = await this.getTraderRecentTrades(trader.address);
      
      // Analyze trader's token preferences
      const tokenAnalysis = this.analyzeTraderTokens(recentTrades);
      
      // Store high-performance trader
      this.highPerformanceTraders.set(trader.address, {
        ...trader,
        recentTrades,
        tokenAnalysis,
        analyzedAt: Date.now()
      });
      
      this.logger.info(`⭐ Added high-performance trader: ${trader.address.slice(0, 8)}... (${(trader.winRate * 100).toFixed(1)}% win rate)`);
      
      // Check if we should copy any recent trades
      for (const trade of recentTrades.slice(0, 3)) {
        await this.evaluateTraderTrade(trader, trade);
      }
      
    } catch (error) {
      this.logger.warn('Failed to analyze trader:', error.message);
    }
  }

  async getTraderRecentTrades(traderAddress) {
    try {
      // This would fetch real trades from Solana blockchain
      // For now, simulate recent trades
      const symbols = ['SOL', 'BONK', 'WIF', 'PEPE', 'JUP', 'PYTH', 'JTO', 'RNDR'];
      const trades = [];
      
      for (let i = 0; i < 5; i++) {
        trades.push({
          token: symbols[Math.floor(Math.random() * symbols.length)],
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          amount: (Math.random() * 10 + 1).toFixed(2),
          price: (Math.random() * 100 + 10).toFixed(4),
          timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          pnl: (Math.random() - 0.3) * 1000
        });
      }
      
      return trades;
      
    } catch (error) {
      return [];
    }
  }

  analyzeTraderTokens(trades) {
    const tokenFreq = {};
    const tokenPnL = {};
    
    trades.forEach(trade => {
      tokenFreq[trade.token] = (tokenFreq[trade.token] || 0) + 1;
      tokenPnL[trade.token] = (tokenPnL[trade.token] || 0) + trade.pnl;
    });
    
    return {
      favoriteTokens: Object.keys(tokenFreq).sort((a, b) => tokenFreq[b] - tokenFreq[a]),
      profitableTokens: Object.keys(tokenPnL).filter(token => tokenPnL[token] > 0),
      totalTrades: trades.length
    };
  }

  async evaluateTraderTrade(trader, trade) {
    try {
      // Only evaluate recent buy trades
      if (trade.action !== 'buy' || Date.now() - trade.timestamp > 30 * 60 * 1000) {
        return;
      }
      
      // Calculate confidence based on trader performance and trade characteristics
      let confidence = trader.winRate * 0.6; // Base confidence from win rate
      
      // Add confidence based on trader's history with this token
      if (trader.tokenAnalysis.profitableTokens.includes(trade.token)) {
        confidence += 0.2;
      }
      
      // Check if token is in our discovered high-potential list
      const tokenPotential = Array.from(this.discoveredTokens.values())
        .find(t => t.token === trade.token);
      
      if (tokenPotential) {
        confidence += tokenPotential.potentialScore * 0.3;
      }
      
      // Emit copy trade signal if confidence is high
      if (confidence > 0.75) {
        this.emitCopyTradeSignal(trader, trade, confidence);
      }
      
    } catch (error) {
      this.logger.warn('Failed to evaluate trader trade:', error.message);
    }
  }

  async checkHighPerformanceTraderActivity(tokenAddress) {
    try {
      let score = 0;
      const activeTraders = [];
      
      // Check if any tracked high-performance traders are trading this token
      for (const [address, trader] of this.highPerformanceTraders) {
        const hasRecentTrade = trader.recentTrades?.some(trade => 
          trade.token === tokenAddress && 
          Date.now() - trade.timestamp < 2 * 60 * 60 * 1000 // Last 2 hours
        );
        
        if (hasRecentTrade) {
          score += trader.winRate * 0.4;
          activeTraders.push({
            address: address.slice(0, 8) + '...',
            winRate: trader.winRate
          });
        }
      }
      
      return {
        score: Math.min(score, 1.0),
        activeTraders,
        count: activeTraders.length
      };
      
    } catch (error) {
      return { score: 0, activeTraders: [], count: 0 };
    }
  }

  emitTradingSignal(token, analysis, score) {
    // Emit signal that can be picked up by trading agent
    process.emit('tradingSignal', {
      type: 'newTokenOpportunity',
      token: token.symbol || token.name,
      address: token.address,
      confidence: score,
      reasons: analysis.reasons,
      recommendedAction: 'buy',
      suggestedAmount: Math.min(score * 50, 25), // Max $25 per new token
      source: 'tokenDiscovery'
    });
    
    this.logger.info(`🚨 TRADING SIGNAL: Buy ${token.symbol} (Confidence: ${(score * 100).toFixed(1)}%)`);
  }

  emitCopyTradeSignal(trader, trade, confidence) {
    // Emit copy trade signal
    process.emit('copyTradeSignal', {
      type: 'copyTrade',
      originalTrader: trader.address.slice(0, 8) + '...',
      token: trade.token,
      action: trade.action,
      amount: trade.amount,
      confidence: confidence,
      traderWinRate: trader.winRate,
      source: 'highPerformanceTrader'
    });
    
    this.logger.info(`🎯 COPY TRADE SIGNAL: ${trade.action} ${trade.token} from trader with ${(trader.winRate * 100).toFixed(1)}% win rate`);
  }
}

module.exports = MarketAnalysisAgent;
