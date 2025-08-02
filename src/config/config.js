// Configuration file for trading strategies
module.exports = {
  trading: {
    // Risk management
    maxPositionSize: 100, // USD
    maxPortfolioRisk: 0.8, // 80% of portfolio
    stopLossPercentage: 5, // 5%
    takeProfitPercentage: 15, // 15%
    maxActivePositions: 10,
    
    // Memecoin specific
    memecoin: {
      maxPositionSize: 50, // USD
      maxHoldTime: 24 * 60 * 60 * 1000, // 24 hours
      minConfidence: 0.6,
      quickSellThreshold: 0.1, // 10% profit
      marketCapRange: {
        min: 10000,
        max: 10000000
      }
    },
    
    // Copy trading
    copyTrading: {
      enabled: true,
      maxCopyAmount: 20, // USD
      minTraderSuccessRate: 0.6,
      maxTraders: 10,
      copyRatio: 0.1 // Copy 10% of original trade size
    }
  },
  
  analysis: {
    // Technical indicators
    rsi: {
      period: 14,
      oversold: 30,
      overbought: 70
    },
    
    macd: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    
    // Pattern recognition
    patterns: {
      minDataPoints: 20,
      trendConfidence: 0.7
    }
  },
  
  social: {
    // Sentiment analysis
    sentiment: {
      bullishThreshold: 0.2,
      bearishThreshold: -0.2,
      minMentions: 10
    },
    
    // Keywords for memecoin detection
    memeKeywords: [
      'moon', 'rocket', 'diamond hands', 'hodl', 'ape',
      'pump', 'gem', 'next doge', 'x100', 'lambo',
      'degen', 'chad', 'wojak', 'pepe', 'shiba'
    ],
    
    // Influencer weights
    influencerWeights: {
      'elonmusk': 1.0,
      'VitalikButerin': 0.9,
      'cz_binance': 0.8,
      'PlanB': 0.7,
      'APompliano': 0.6
    }
  },
  
  market: {
    // Price thresholds
    minPriceChange24h: 10, // 10%
    minVolume24h: 100000, // $100k
    maxVolatility: 50, // 50%
    
    // Market conditions
    conditions: {
      bull: { sentimentThreshold: 0.3, minGainers: 60 },
      bear: { sentimentThreshold: -0.3, maxGainers: 30 },
      neutral: { sentimentThreshold: 0.1 }
    }
  },
  
  wallet: {
    // Transaction settings
    slippageTolerance: 0.5, // 0.5%
    priorityFee: 0.001, // SOL
    confirmationTimeout: 30000, // 30 seconds
    
    // Safety reserves
    minSolBalance: 0.1, // Keep 0.1 SOL for fees
    emergencyStopLoss: 0.2 // 20% portfolio loss
  },
  
  api: {
    // Rate limiting
    rateLimits: {
      coingecko: 100, // requests per minute
      birdeye: 300,
      twitter: 180,
      jupiter: 600
    },
    
    // Timeouts
    timeouts: {
      default: 5000,
      blockchain: 30000,
      social: 10000
    }
  },
  
  logging: {
    level: 'info',
    maxFiles: 10,
    maxSize: '10MB',
    compression: true
  }
};
