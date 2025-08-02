const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');
const Sentiment = require('sentiment');
const Logger = require('../utils/Logger');

class SocialIntelligenceAgent {
  constructor() {
    this.logger = new Logger('SocialIntelligenceAgent');
    this.sentiment = new Sentiment();
    this.isRunning = false;
    this.socialData = {
      twitterMentions: {},
      newsMentions: {},
      sentimentScores: {},
      trendingTopics: [],
      influencerSignals: []
    };
  }

  async initialize() {
    this.logger.info('🐦 Initializing Social Intelligence Agent...');
    
    // Initialize Twitter API with validation
    if (process.env.TWITTER_BEARER_TOKEN && 
        process.env.TWITTER_BEARER_TOKEN.startsWith('AAAAAAAAAAAAAAAAAAAA') &&
        process.env.TWITTER_BEARER_TOKEN.length > 50) {
      try {
        this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
        this.logger.info('✅ Twitter API client initialized successfully');
      } catch (error) {
        this.logger.warn('⚠️ Failed to initialize Twitter client:', error.message);
      }
    } else {
      this.logger.warn('⚠️ Twitter Bearer Token not properly configured');
    }
    
    // Crypto influencers to monitor
    this.influencers = [
      'elonmusk',
      'CoinDesk', 
      'cz_binance',
      'VitalikButerin',
      'DocumentingBTC',
      'whale_alert',
      'PlanB',
      'APompliano',
      'naval'
    ];
    
    // Memecoin keywords to track
    this.memeKeywords = [
      'memecoin', 'meme coin', 'shitcoin', 'altcoin',
      'doge', 'shiba', 'pepe', 'wojak', 'chad',
      'moon', 'rocket', 'diamond hands', 'hodl',
      'ape', 'pump', 'gem', 'next doge', 'x100' , 'pump.fun'
    ];
    
    this.logger.info('✅ Social Intelligence Agent initialized');
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.logger.info('🎯 Starting social intelligence monitoring...');
    
    this.startTwitterMonitoring();
    this.startNewsMonitoring();
    this.startInfluencerTracking();
  }

  async stop() {
    this.isRunning = false;
    this.logger.info('🛑 Social intelligence monitoring stopped');
  }

  startTwitterMonitoring() {
    const twitterInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(twitterInterval);
        return;
      }
      
      try {
        await this.monitorTwitterTrends();
        await this.analyzeMemecoinMentions();
      } catch (error) {
        this.logger.error('Error in Twitter monitoring:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  startNewsMonitoring() {
    const newsInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(newsInterval);
        return;
      }
      
      try {
        await this.monitorCryptoNews();
        await this.analyzeNewsImpact();
      } catch (error) {
        this.logger.error('Error in news monitoring:', error);
      }
    }, 60000); // Check every minute
  }

  startInfluencerTracking() {
    const influencerInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(influencerInterval);
        return;
      }
      
      try {
        await this.trackInfluencerSignals();
      } catch (error) {
        this.logger.error('Error in influencer tracking:', error);
      }
    }, 120000); // Check every 2 minutes
  }

  async monitorTwitterTrends() {
    if (!this.twitterClient) return;
    
    try {
      // Get trending topics
      const trends = await this.twitterClient.v1.trendsAvailable();
      const cryptoTrends = trends.filter(trend => 
        this.isCryptoRelated(trend.name)
      );
      
      this.socialData.trendingTopics = cryptoTrends.map(trend => ({
        name: trend.name,
        volume: trend.tweet_volume || 0,
        timestamp: Date.now()
      }));
      
      this.logger.info(`📈 Found ${cryptoTrends.length} crypto-related trending topics`);
      
    } catch (error) {
      this.logger.error('Failed to fetch Twitter trends:', error);
    }
  }

  async analyzeMemecoinMentions() {
    if (!this.twitterClient) return;
    
    try {
      const mentions = {};
      
      // Search for memecoin-related tweets
      for (const keyword of this.memeKeywords.slice(0, 5)) { // Limit to avoid rate limits
        const tweets = await this.twitterClient.v2.search(`${keyword} crypto`, {
          'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
          max_results: 100
        });
        
        if (tweets.data) {
          mentions[keyword] = tweets.data.map(tweet => ({
            id: tweet.id,
            text: tweet.text,
            sentiment: this.sentiment.analyze(tweet.text),
            metrics: tweet.public_metrics,
            created_at: tweet.created_at
          }));
        }
        
        // Respect rate limits
        await this.delay(1000);
      }
      
      this.socialData.twitterMentions = mentions;
      await this.calculateSentimentScores();
      
    } catch (error) {
      this.logger.error('Failed to analyze memecoin mentions:', error);
    }
  }

  async trackInfluencerSignals() {
    if (!this.twitterClient) return;
    
    try {
      const signals = [];
      
      for (const influencer of this.influencers.slice(0, 3)) { // Limit to avoid rate limits
        try {
          const user = await this.twitterClient.v2.userByUsername(influencer);
          if (!user.data) continue;
          
          const tweets = await this.twitterClient.v2.userTimeline(user.data.id, {
            'tweet.fields': ['created_at', 'public_metrics'],
            max_results: 10
          });
          
          if (tweets.data) {
            const cryptoTweets = tweets.data.filter(tweet => 
              this.isCryptoRelated(tweet.text)
            );
            
            for (const tweet of cryptoTweets) {
              signals.push({
                influencer,
                tweet: tweet.text,
                sentiment: this.sentiment.analyze(tweet.text),
                metrics: tweet.public_metrics,
                created_at: tweet.created_at,
                impact: this.calculateInfluencerImpact(influencer, tweet.public_metrics)
              });
            }
          }
          
          await this.delay(2000); // Respect rate limits
          
        } catch (userError) {
          this.logger.warn(`Failed to fetch data for ${influencer}:`, userError.message);
        }
      }
      
      this.socialData.influencerSignals = signals;
      this.logger.info(`📢 Processed ${signals.length} influencer signals`);
      
    } catch (error) {
      this.logger.error('Failed to track influencer signals:', error);
    }
  }

  async monitorCryptoNews() {
    try {
      // Fetch crypto news from multiple sources
      const newsPromises = [
        this.fetchNewsAPI(),
        this.fetchCryptoNewsAPI(),
        this.fetchAlphaVantageNews()
      ];
      
      const newsResults = await Promise.allSettled(newsPromises);
      const allNews = newsResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);
      
      this.socialData.newsMentions = allNews;
      
    } catch (error) {
      this.logger.error('Failed to monitor crypto news:', error);
    }
  }

  async fetchNewsAPI() {
    if (!process.env.NEWS_API_KEY) return [];
    
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'cryptocurrency OR bitcoin OR ethereum OR solana OR memecoin',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 50,
          apiKey: process.env.NEWS_API_KEY
        }
      });
      
      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        sentiment: this.sentiment.analyze(article.title + ' ' + article.description)
      }));
      
    } catch (error) {
      this.logger.error('Failed to fetch NewsAPI data:', error);
      return [];
    }
  }

  async fetchCryptoNewsAPI() {
    try {
      const response = await axios.get('https://cryptonews-api.com/api/v1/category', {
        params: {
          section: 'general',
          items: 50,
          page: 1
        }
      });
      
      return response.data.data.map(article => ({
        title: article.title,
        description: article.text,
        url: article.news_url,
        source: article.source_name,
        publishedAt: article.date,
        sentiment: this.sentiment.analyze(article.title + ' ' + article.text)
      }));
      
    } catch (error) {
      this.logger.error('Failed to fetch CryptoNewsAPI data:', error);
      return [];
    }
  }

  async fetchAlphaVantageNews() {
    if (!process.env.ALPHA_VANTAGE_KEY) return [];
    
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: 'CRYPTO:BTC,CRYPTO:ETH,CRYPTO:SOL',
          apikey: process.env.ALPHA_VANTAGE_KEY
        }
      });
      
      if (response.data.feed) {
        return response.data.feed.map(article => ({
          title: article.title,
          description: article.summary,
          url: article.url,
          source: article.source,
          publishedAt: article.time_published,
          sentiment: {
            score: parseFloat(article.overall_sentiment_score),
            label: article.overall_sentiment_label
          }
        }));
      }
      
      return [];
      
    } catch (error) {
      this.logger.error('Failed to fetch Alpha Vantage news:', error);
      return [];
    }
  }

  async analyzeNewsImpact() {
    const news = this.socialData.newsMentions || [];
    const impactfulNews = news.filter(article => {
      const sentiment = article.sentiment;
      const isHighImpact = Math.abs(sentiment.score || 0) > 0.5 ||
                          Math.abs(sentiment.comparative || 0) > 0.1;
      
      // Check for market-moving keywords
      const text = (article.title + ' ' + article.description).toLowerCase();
      const impactKeywords = [
        'regulation', 'ban', 'approval', 'etf', 'adoption',
        'partnership', 'hack', 'exploit', 'pump', 'dump',
        'elon musk', 'sec', 'fed', 'interest rate'
      ];
      
      const hasImpactKeyword = impactKeywords.some(keyword => text.includes(keyword));
      
      return isHighImpact || hasImpactKeyword;
    });
    
    if (impactfulNews.length > 0) {
      this.logger.info(`📰 Found ${impactfulNews.length} impactful news articles`);
    }
    
    return impactfulNews;
  }

  async calculateSentimentScores() {
    const sentimentScores = {};
    
    // Calculate sentiment for each tracked keyword
    for (const [keyword, mentions] of Object.entries(this.socialData.twitterMentions)) {
      if (mentions && mentions.length > 0) {
        const totalSentiment = mentions.reduce((sum, mention) => 
          sum + (mention.sentiment.comparative || 0), 0
        );
        
        sentimentScores[keyword] = {
          score: totalSentiment / mentions.length,
          volume: mentions.length,
          bullish: mentions.filter(m => (m.sentiment.comparative || 0) > 0.1).length,
          bearish: mentions.filter(m => (m.sentiment.comparative || 0) < -0.1).length,
          neutral: mentions.filter(m => Math.abs(m.sentiment.comparative || 0) <= 0.1).length
        };
      }
    }
    
    this.socialData.sentimentScores = sentimentScores;
  }

  calculateInfluencerImpact(influencer, metrics) {
    const followerWeight = {
      'elonmusk': 1.0,
      'VitalikButerin': 0.9,
      'cz_binance': 0.8,
      'naval': 0.7,
      'APompliano': 0.6
    };
    
    const weight = followerWeight[influencer] || 0.5;
    const engagement = (metrics.retweet_count || 0) + (metrics.like_count || 0);
    
    return weight * Math.log(engagement + 1);
  }

  isCryptoRelated(text) {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain',
      'solana', 'sol', 'defi', 'nft', 'dao', 'web3', 'metaverse',
      'doge', 'shib', 'memecoin', 'altcoin', 'hodl', 'moon'
    ];
    
    const lowerText = text.toLowerCase();
    return cryptoKeywords.some(keyword => lowerText.includes(keyword));
  }

  async getSentiment() {
    return {
      socialData: this.socialData,
      summary: {
        overallSentiment: this.calculateOverallSentiment(),
        trendingCount: this.socialData.trendingTopics.length,
        influencerSignalsCount: this.socialData.influencerSignals.length,
        newsCount: this.socialData.newsMentions.length
      },
      timestamp: Date.now()
    };
  }

  calculateOverallSentiment() {
    const sentimentScores = Object.values(this.socialData.sentimentScores);
    if (sentimentScores.length === 0) return 0;
    
    const totalScore = sentimentScores.reduce((sum, score) => sum + score.score, 0);
    return totalScore / sentimentScores.length;
  }

  // ===== ENHANCED TOKEN SENTIMENT ANALYSIS =====

  async analyzeTokenSentiment(tokenSymbol) {
    try {
      this.logger.info(`🔍 Analyzing sentiment for ${tokenSymbol}...`);
      
      const sentiment = {
        token: tokenSymbol,
        mentionCount: 0,
        sentimentScore: 0,
        influencerMentions: 0,
        trendingScore: 0,
        timestamp: Date.now()
      };
      
      // 1. Check Twitter mentions
      const twitterData = await this.getTokenTwitterMentions(tokenSymbol);
      sentiment.mentionCount = twitterData.mentionCount;
      sentiment.sentimentScore = twitterData.sentimentScore;
      
      // 2. Check influencer activity
      const influencerData = await this.checkInfluencerMentions(tokenSymbol);
      sentiment.influencerMentions = influencerData.count;
      
      // 3. Calculate trending score
      sentiment.trendingScore = this.calculateTrendingScore(sentiment);
      
      // Store sentiment data
      this.socialData.sentimentScores[tokenSymbol] = sentiment;
      
      this.logger.info(`📊 ${tokenSymbol} sentiment: ${sentiment.mentionCount} mentions, score: ${sentiment.sentimentScore.toFixed(2)}`);
      
      return sentiment.trendingScore;
      
    } catch (error) {
      this.logger.warn(`Failed to analyze sentiment for ${tokenSymbol}:`, error.message);
      return 0;
    }
  }

  async getTokenTwitterMentions(tokenSymbol) {
    try {
      if (!this.twitterClient) {
        // Simulate data for demo
        return {
          mentionCount: Math.floor(Math.random() * 500),
          sentimentScore: (Math.random() - 0.5) * 2 // -1 to 1
        };
      }
      
      // Search for recent tweets mentioning the token
      const tweets = await this.twitterClient.v2.search(`$${tokenSymbol} OR ${tokenSymbol}`, {
        max_results: 100,
        'tweet.fields': 'created_at,public_metrics'
      });
      
      let totalSentiment = 0;
      let count = 0;
      
      for (const tweet of tweets.data || []) {
        const analysis = this.sentiment.analyze(tweet.text);
        totalSentiment += analysis.score;
        count++;
      }
      
      return {
        mentionCount: count,
        sentimentScore: count > 0 ? totalSentiment / count : 0
      };
      
    } catch (error) {
      // Return simulated data on error
      return {
        mentionCount: Math.floor(Math.random() * 100),
        sentimentScore: (Math.random() - 0.3) * 2
      };
    }
  }

  async checkInfluencerMentions(tokenSymbol) {
    try {
      let count = 0;
      
      for (const influencer of this.influencers.slice(0, 5)) {
        try {
          if (!this.twitterClient) {
            // Simulate influencer activity
            if (Math.random() > 0.8) count++;
            continue;
          }
          
          const userTweets = await this.twitterClient.v2.userTimelineByUsername(influencer, {
            max_results: 10,
            exclude: 'retweets'
          });
          
          for (const tweet of userTweets.data || []) {
            if (tweet.text.toLowerCase().includes(tokenSymbol.toLowerCase())) {
              count++;
              this.logger.info(`🌟 Influencer ${influencer} mentioned ${tokenSymbol}`);
            }
          }
          
          // Rate limiting
          await this.delay(1000);
          
        } catch (error) {
          // Continue to next influencer on error
        }
      }
      
      return { count };
      
    } catch (error) {
      return { count: 0 };
    }
  }

  calculateTrendingScore(sentiment) {
    let score = 0;
    
    // Mention volume (0-0.4)
    const mentionScore = Math.min(sentiment.mentionCount / 1000, 1) * 0.4;
    score += mentionScore;
    
    // Sentiment positivity (0-0.3)
    const sentimentMultiplier = Math.max(0, (sentiment.sentimentScore + 1) / 2); // Normalize to 0-1
    score += sentimentMultiplier * 0.3;
    
    // Influencer boost (0-0.3)
    const influencerBoost = Math.min(sentiment.influencerMentions / 3, 1) * 0.3;
    score += influencerBoost;
    
    return Math.min(score, 1.0);
  }

  // Method for market analysis agent to call
  async getTokenSentimentScore(tokenSymbol) {
    const existing = this.socialData.sentimentScores[tokenSymbol];
    
    // Return cached if recent (less than 30 minutes old)
    if (existing && Date.now() - existing.timestamp < 30 * 60 * 1000) {
      return existing.trendingScore;
    }
    
    // Otherwise analyze fresh
    return await this.analyzeTokenSentiment(tokenSymbol);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SocialIntelligenceAgent;
