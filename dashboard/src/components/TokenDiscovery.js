import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon as SearchIcon, TrendingUpIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline';

const TokenDiscovery = () => {
  const [discoveredTokens, setDiscoveredTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    fetchDiscoveredTokens();
    const interval = setInterval(fetchDiscoveredTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDiscoveredTokens = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/discovery/tokens');
      const data = await response.json();
      setDiscoveredTokens(data.data?.tokens || []);
    } catch (error) {
      console.error('Failed to fetch discovered tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockTokens = [
    {
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      symbol: 'USDT',
      name: 'Tether USD',
      potentialScore: 0.85,
      twitterSentiment: 0.78,
      v24hUSD: 2500000,
      priceChange24h: 0.02,
      marketCap: 85000000000,
      discoveredAt: Date.now() - 1800000,
      reasons: ['High volume', 'Strong Twitter buzz', 'Top trader activity']
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      potentialScore: 0.92,
      twitterSentiment: 0.88,
      v24hUSD: 5800000,
      priceChange24h: 0.01,
      marketCap: 34000000000,
      discoveredAt: Date.now() - 3600000,
      reasons: ['Massive volume', 'Institutional interest', 'High-performance traders active']
    },
    {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      symbol: 'BONK',
      name: 'Bonk',
      potentialScore: 0.76,
      twitterSentiment: 0.65,
      v24hUSD: 890000,
      priceChange24h: 12.5,
      marketCap: 1200000000,
      discoveredAt: Date.now() - 7200000,
      reasons: ['Meme coin momentum', 'Community growth', 'Social media buzz']
    }
  ];

  const tokensToShow = discoveredTokens.length > 0 ? discoveredTokens : mockTokens;

  const formatTimeAgo = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="token-discovery">
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold text-white">Token Discovery</h1>
        <p className="text-gray-400 mt-1">AI-powered analysis of emerging opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <SearchIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Active Scanning</h3>
              <p className="text-gray-400 text-sm">Birdeye • Jupiter • DexScreener</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <TrendingUpIcon className="w-8 h-8 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">{tokensToShow.length} Discovered</h3>
              <p className="text-gray-400 text-sm">High-potential tokens</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center space-x-3">
            <EyeIcon className="w-8 h-8 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Live Monitoring</h3>
              <p className="text-gray-400 text-sm">Real-time analysis</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-card text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Scanning for new opportunities...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tokensToShow.map((token, index) => (
            <div key={index} className="dashboard-card cursor-pointer" onClick={() => setSelectedToken(token)}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{token.symbol}</h3>
                    <p className="text-gray-400">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-bold text-white">
                      {((token.potentialScore || 0.75) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Potential Score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">24h Volume</p>
                  <p className="text-white font-semibold">{formatNumber(token.v24hUSD || 500000)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Price Change</p>
                  <p className={`font-semibold ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Market Cap</p>
                  <p className="text-white font-semibold">{formatNumber(token.marketCap || 10000000)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Discovered</p>
                  <p className="text-white font-semibold">{formatTimeAgo(token.discoveredAt || Date.now())}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Twitter Sentiment</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(token.twitterSentiment || 0.65) * 100}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-400 mt-1">
                  {((token.twitterSentiment || 0.65) * 100).toFixed(0)}% positive
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Discovery Reasons</p>
                <div className="flex flex-wrap gap-2">
                  {(token.reasons || ['High activity', 'Community interest']).map((reason, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">{selectedToken.symbol} Details</h3>
            <p className="text-gray-400 mb-4">{selectedToken.name}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Potential Score:</span>
                <span className="text-white font-semibold">
                  {((selectedToken.potentialScore || 0.75) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono text-sm">
                  {selectedToken.address.slice(0, 8)}...{selectedToken.address.slice(-8)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedToken(null)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDiscovery;
