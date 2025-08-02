const axios = require('axios');
const Logger = require('../utils/Logger');

class PriceOracle {
  constructor() {
    this.logger = new Logger('PriceOracle');
    this.priceCache = new Map();
    this.cacheTTL = 30000; // 30 seconds
  }

  async initialize() {
    this.logger.info('💎 Initializing Price Oracle...');
    
    // Initialize price feeds
    this.priceSources = [
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3',
        weight: 0.4
      },
      {
        name: 'Birdeye',
        url: 'https://public-api.birdeye.so',
        weight: 0.4,
        headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY }
      },
      {
        name: 'Jupiter',
        url: 'https://quote-api.jup.ag/v6',
        weight: 0.2
      }
    ];
    
    this.logger.info('✅ Price Oracle initialized');
  }

  async getPrice(tokenAddress, forceRefresh = false) {
    const cacheKey = `price_${tokenAddress}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.price;
    }
    
    try {
      const prices = await Promise.allSettled([
        this.getCoinGeckoPrice(tokenAddress),
        this.getBirdeyePrice(tokenAddress),
        this.getJupiterPrice(tokenAddress)
      ]);
      
      const validPrices = prices
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      if (validPrices.length === 0) {
        throw new Error('No valid prices found');
      }
      
      // Calculate weighted average
      const weightedPrice = this.calculateWeightedPrice(validPrices);
      
      // Cache the result
      this.priceCache.set(cacheKey, {
        price: weightedPrice,
        timestamp: Date.now(),
        sources: validPrices.length
      });
      
      return weightedPrice;
      
    } catch (error) {
      this.logger.error(`Failed to get price for ${tokenAddress}:`, error);
      
      // Return cached price if available
      if (cached) {
        this.logger.warn(`Using stale cached price for ${tokenAddress}`);
        return cached.price;
      }
      
      return null;
    }
  }

  async getCoinGeckoPrice(tokenAddress) {
    try {
      // For Solana tokens, we need to use contract address
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/solana`, {
        params: {
          contract_addresses: tokenAddress,
          vs_currencies: 'usd'
        },
        timeout: 5000
      });
      
      return response.data[tokenAddress]?.usd || null;
      
    } catch (error) {
      this.logger.debug('CoinGecko price fetch failed:', error.message);
      return null;
    }
  }

  async getBirdeyePrice(tokenAddress) {
    try {
      if (!process.env.BIRDEYE_API_KEY) return null;
      
      const response = await axios.get(`https://public-api.birdeye.so/defi/price`, {
        params: {
          address: tokenAddress
        },
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY
        },
        timeout: 5000
      });
      
      return response.data.data?.value || null;
      
    } catch (error) {
      this.logger.debug('Birdeye price fetch failed:', error.message);
      return null;
    }
  }

  async getJupiterPrice(tokenAddress) {
    try {
      // Get quote from Jupiter (1 unit of token to USDC)
      const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      const response = await axios.get(`https://quote-api.jup.ag/v6/quote`, {
        params: {
          inputMint: tokenAddress,
          outputMint: usdcMint,
          amount: 1000000, // 1 token with 6 decimals
          slippageBps: 50
        },
        timeout: 5000
      });
      
      if (response.data.data && response.data.data.length > 0) {
        const outAmount = response.data.data[0].outAmount;
        return outAmount / 1000000; // Convert back to USDC
      }
      
      return null;
      
    } catch (error) {
      this.logger.debug('Jupiter price fetch failed:', error.message);
      return null;
    }
  }

  calculateWeightedPrice(prices) {
    if (prices.length === 1) return prices[0];
    
    // Simple average for now, could implement actual weighting
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
  }

  async getPriceHistory(tokenAddress, days = 7) {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/solana/contract/${tokenAddress}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days
        },
        timeout: 10000
      });
      
      return response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        price
      }));
      
    } catch (error) {
      this.logger.error(`Failed to get price history for ${tokenAddress}:`, error);
      return [];
    }
  }

  async getMultiplePrices(tokenAddresses) {
    const promises = tokenAddresses.map(address => 
      this.getPrice(address).catch(error => {
        this.logger.warn(`Failed to get price for ${address}:`, error.message);
        return null;
      })
    );
    
    const prices = await Promise.all(promises);
    
    return tokenAddresses.reduce((acc, address, index) => {
      acc[address] = prices[index];
      return acc;
    }, {});
  }

  async getTokenInfo(tokenAddress) {
    try {
      if (!process.env.BIRDEYE_API_KEY) return null;
      
      const response = await axios.get(`https://public-api.birdeye.so/defi/token_overview`, {
        params: {
          address: tokenAddress
        },
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY
        },
        timeout: 5000
      });
      
      const data = response.data.data;
      
      return {
        symbol: data.symbol,
        name: data.name,
        decimals: data.decimals,
        supply: data.supply,
        price: data.price,
        marketCap: data.mc,
        volume24h: data.v24hUSD,
        priceChange24h: data.priceChange24hPercent
      };
      
    } catch (error) {
      this.logger.error(`Failed to get token info for ${tokenAddress}:`, error);
      return null;
    }
  }

  clearCache() {
    this.priceCache.clear();
    this.logger.info('💾 Price cache cleared');
  }

  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, value] of this.priceCache.entries()) {
      if (now - value.timestamp < this.cacheTTL) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      total: this.priceCache.size,
      valid: validEntries,
      expired: expiredEntries,
      hitRate: validEntries / (validEntries + expiredEntries) || 0
    };
  }

  // Cleanup expired cache entries
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.priceCache.entries()) {
      if (now - value.timestamp >= this.cacheTTL) {
        this.priceCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
}

module.exports = PriceOracle;
