class MemeStrategy {
  constructor(config) {
    this.config = config;
    this.name = 'Memecoin Strategy';
  }

  analyze(token, marketData, socialData) {
    const signals = {
      score: 0,
      confidence: 0,
      signals: []
    };

    // Check if token matches memecoin criteria
    if (!this.isMemeToken(token)) {
      return signals;
    }

    // Price action signals
    const priceSignals = this.analyzePriceAction(token);
    signals.score += priceSignals.score * 0.3;
    signals.signals.push(...priceSignals.signals);

    // Social sentiment signals
    const socialSignals = this.analyzeSocialSentiment(token, socialData);
    signals.score += socialSignals.score * 0.4;
    signals.signals.push(...socialSignals.signals);

    // Volume analysis
    const volumeSignals = this.analyzeVolume(token);
    signals.score += volumeSignals.score * 0.2;
    signals.signals.push(...volumeSignals.signals);

    // Timing signals
    const timingSignals = this.analyzeTiming(token);
    signals.score += timingSignals.score * 0.1;
    signals.signals.push(...timingSignals.signals);

    signals.confidence = Math.min(signals.score, 1.0);

    return signals;
  }

  isMemeToken(token) {
    const name = (token.name || '').toLowerCase();
    const symbol = (token.symbol || '').toLowerCase();
    
    const memeKeywords = this.config.social.memeKeywords;
    
    return memeKeywords.some(keyword => 
      name.includes(keyword) || symbol.includes(keyword)
    );
  }

  analyzePriceAction(token) {
    const signals = { score: 0, signals: [] };
    
    const priceChange24h = token.price_change_percentage_24h || 0;
    const marketCap = token.market_cap || 0;
    
    // Strong price momentum
    if (priceChange24h > 50) {
      signals.score += 0.4;
      signals.signals.push('Strong upward momentum');
    } else if (priceChange24h > 20) {
      signals.score += 0.2;
      signals.signals.push('Moderate upward momentum');
    }
    
    // Market cap in sweet spot
    if (marketCap > 100000 && marketCap < 5000000) {
      signals.score += 0.3;
      signals.signals.push('Optimal market cap range');
    }
    
    // Recent listing bonus
    if (token.ath_date && Date.now() - new Date(token.ath_date).getTime() < 7 * 24 * 60 * 60 * 1000) {
      signals.score += 0.2;
      signals.signals.push('Recently listed');
    }
    
    return signals;
  }

  analyzeSocialSentiment(token, socialData) {
    const signals = { score: 0, signals: [] };
    
    if (!socialData.socialData) return signals;
    
    const tokenSymbol = token.symbol.toLowerCase();
    
    // Check Twitter mentions
    if (socialData.socialData.twitterMentions) {
      for (const [keyword, mentions] of Object.entries(socialData.socialData.twitterMentions)) {
        if (keyword.includes(tokenSymbol) && mentions.length > 5) {
          signals.score += 0.3;
          signals.signals.push(`High Twitter activity (${mentions.length} mentions)`);
          
          // Sentiment analysis
          const avgSentiment = mentions.reduce((sum, mention) => 
            sum + (mention.sentiment.comparative || 0), 0) / mentions.length;
          
          if (avgSentiment > 0.1) {
            signals.score += 0.2;
            signals.signals.push('Positive sentiment');
          }
        }
      }
    }
    
    // Check trending topics
    if (socialData.socialData.trendingTopics) {
      const trending = socialData.socialData.trendingTopics.some(topic => 
        topic.name.toLowerCase().includes(tokenSymbol)
      );
      
      if (trending) {
        signals.score += 0.4;
        signals.signals.push('Trending on social media');
      }
    }
    
    return signals;
  }

  analyzeVolume(token) {
    const signals = { score: 0, signals: [] };
    
    const volume24h = token.total_volume || 0;
    const marketCap = token.market_cap || 1;
    const volumeRatio = volume24h / marketCap;
    
    // High volume relative to market cap
    if (volumeRatio > 0.5) {
      signals.score += 0.4;
      signals.signals.push('Extremely high volume');
    } else if (volumeRatio > 0.2) {
      signals.score += 0.2;
      signals.signals.push('High volume');
    }
    
    // Volume change
    const volumeChange = token.volume_change_24h || 0;
    if (volumeChange > 100) {
      signals.score += 0.3;
      signals.signals.push('Volume spike detected');
    }
    
    return signals;
  }

  analyzeTiming(token) {
    const signals = { score: 0, signals: [] };
    
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Peak trading hours (US market open)
    if (hour >= 13 && hour <= 21) { // 9 AM - 5 PM EST
      signals.score += 0.3;
      signals.signals.push('Peak trading hours');
    }
    
    // Weekend bonus for memecoins
    const day = now.getUTCDay();
    if (day === 0 || day === 6) { // Sunday or Saturday
      signals.score += 0.2;
      signals.signals.push('Weekend memecoin activity');
    }
    
    return signals;
  }

  getPositionSize(confidence, portfolioValue) {
    const baseSize = this.config.trading.memecoin.maxPositionSize;
    const adjustedSize = baseSize * confidence;
    
    // Never risk more than 5% of portfolio on a single memecoin
    const maxRisk = portfolioValue * 0.05;
    
    return Math.min(adjustedSize, maxRisk);
  }

  getStopLoss(entryPrice) {
    return entryPrice * (1 - this.config.trading.stopLossPercentage / 100);
  }

  getTakeProfit(entryPrice, confidence) {
    // Higher confidence = higher take profit target
    const baseTakeProfit = this.config.trading.takeProfitPercentage;
    const adjustedTakeProfit = baseTakeProfit * (1 + confidence * 0.5);
    
    return entryPrice * (1 + adjustedTakeProfit / 100);
  }

  shouldExit(position, currentPrice, timeHeld) {
    // Quick profit taking for memecoins
    const profitPercent = (currentPrice - position.entryPrice) / position.entryPrice;
    
    if (profitPercent > this.config.trading.memecoin.quickSellThreshold) {
      return { shouldExit: true, reason: 'Quick profit target reached' };
    }
    
    // Time-based exit
    if (timeHeld > this.config.trading.memecoin.maxHoldTime) {
      return { shouldExit: true, reason: 'Maximum hold time exceeded' };
    }
    
    // Stop loss
    if (currentPrice <= position.stopLoss) {
      return { shouldExit: true, reason: 'Stop loss triggered' };
    }
    
    // Take profit
    if (currentPrice >= position.takeProfit) {
      return { shouldExit: true, reason: 'Take profit reached' };
    }
    
    return { shouldExit: false };
  }
}

module.exports = MemeStrategy;
