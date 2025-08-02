# 🤖 AI Crypto Trading Bot - Complete Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB (local or cloud)
- Redis (optional, for caching)
- Solana wallet with some SOL for testing

### 2. Installation

```bash
# Clone or download the project
cd "AI trader"

# Install backend dependencies
npm install

# Install dashboard dependencies
cd dashboard
npm install
cd ..

# Copy environment configuration
cp .env.example .env
```

### 3. Configuration

Edit `.env` file with your settings:

```env
# REQUIRED SETTINGS
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TRADING_MODE=paper  # Start with paper trading!

# WALLET (for live trading only)
SOLANA_PRIVATE_KEY=your_wallet_private_key_here
SOLANA_PUBLIC_KEY=your_wallet_public_key_here

# API KEYS (optional but recommended)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
BIRDEYE_API_KEY=your_birdeye_api_key
NEWS_API_KEY=your_news_api_key

# TELEGRAM ALERTS (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# DATABASE
MONGODB_URI=mongodb://localhost:27017/ai-crypto-trader
```

### 4. Run the System

```bash
# Terminal 1: Start the trading bot
npm start

# Terminal 2: Start the dashboard
npm run dashboard
```

### 5. Access Dashboard
Open http://localhost:3000 in your browser

## 📊 Features Overview

### ✅ Market Analysis
- Real-time price monitoring
- Technical indicator analysis (RSI, MACD)
- Pattern recognition
- Volume analysis
- Support/resistance detection

### ✅ Social Intelligence
- Twitter sentiment monitoring
- News correlation analysis
- Influencer tracking
- Trending topic detection
- Memecoin keyword scanning

### ✅ Trading Strategies
- Memecoin sniping
- Copy trading from successful wallets
- Risk management
- Stop-loss and take-profit
- Position sizing

### ✅ Portfolio Management
- Real-time balance tracking
- P&L calculation
- Position monitoring
- Performance analytics
- Risk assessment

### ✅ Safety Features
- Paper trading mode
- Risk limits
- Emergency stops
- Alert system
- Comprehensive logging

## 🔧 Configuration Details

### Trading Parameters
```javascript
// Edit src/config/config.js
trading: {
  maxPositionSize: 100,      // Max USD per position
  stopLossPercentage: 5,     // 5% stop loss
  takeProfitPercentage: 15,  // 15% take profit
  maxActivePositions: 10     // Max concurrent positions
}
```

### API Rate Limits
The bot respects all API rate limits:
- CoinGecko: 100 requests/minute
- Twitter: 180 requests/15 minutes
- Birdeye: 300 requests/minute

## 🛡️ Security Best Practices

### 1. Start with Paper Trading
Always begin with `TRADING_MODE=paper` to test strategies without risking real money.

### 2. Use Small Amounts
When switching to live trading, start with small position sizes.

### 3. Set Risk Limits
Configure appropriate stop-losses and position size limits.

### 4. Monitor Actively
Use the dashboard and Telegram alerts to stay informed.

### 5. Secure Your Keys
- Never commit `.env` files to version control
- Use environment variables in production
- Keep wallet private keys secure

## 📈 Trading Strategies Explained

### Memecoin Strategy
1. **Detection**: Scans for tokens with memecoin characteristics
2. **Analysis**: Evaluates social sentiment and price action
3. **Entry**: Buys when confidence threshold is met
4. **Exit**: Uses dynamic stop-loss and take-profit levels

### Copy Trading
1. **Discovery**: Identifies profitable traders on-chain
2. **Monitoring**: Tracks their recent transactions
3. **Copying**: Replicates successful trades with smaller amounts
4. **Performance**: Tracks copy trading success rates

## 📊 Dashboard Guide

### Main Dashboard
- **Status Panel**: Bot on/off, key metrics
- **Performance Chart**: Real-time P&L visualization
- **Active Positions**: Current trades and their status
- **Market Opportunities**: Detected trading signals

### Pages Available
- Portfolio overview
- Trading history
- Performance analytics
- Alert management
- Configuration settings

## 🔍 Monitoring & Alerts

### Log Files
- `logs/combined.log`: All application logs
- `logs/error.log`: Error logs only

### Telegram Alerts
Set up Telegram bot for real-time notifications:
1. Create bot with @BotFather
2. Get bot token
3. Add token to `.env`
4. Get your chat ID
5. Start receiving alerts!

### Alert Types
- Trade executions
- Profit/loss notifications
- Risk warnings
- System errors
- Market opportunities

## 🧪 Testing & Backtesting

### Paper Trading
Test strategies without risking real money:
```env
TRADING_MODE=paper
```

### Backtesting
Run historical strategy tests:
```javascript
const BacktestEngine = require('./src/utils/BacktestEngine');
const engine = new BacktestEngine();
// See BacktestEngine.js for usage examples
```

## 🚨 Troubleshooting

### Common Issues

1. **Bot won't start**
   - Check `.env` configuration
   - Verify Node.js version (18+)
   - Check MongoDB connection

2. **No trading opportunities**
   - Verify API keys are working
   - Check market conditions
   - Review confidence thresholds

3. **Dashboard not loading**
   - Ensure both backend and frontend are running
   - Check ports 8080 and 3000 are free
   - Verify CORS settings

4. **API rate limits**
   - Bot automatically handles rate limiting
   - Consider premium API keys for higher limits

### Performance Optimization

1. **Reduce API calls**
   - Increase monitoring intervals
   - Cache data when possible
   - Use fewer tracked tokens

2. **Database optimization**
   - Regular cleanup of old data
   - Index optimization
   - Consider Redis for caching

## 🔮 Advanced Features

### Custom Strategies
Add your own trading strategies:
1. Create new file in `src/strategies/`
2. Implement required methods
3. Register in trading agent
4. Configure parameters

### Additional Data Sources
Integrate more APIs:
- DEX price feeds
- On-chain analytics
- Alternative social platforms

### Machine Learning
Enhance with ML:
- Price prediction models
- Sentiment analysis
- Pattern recognition
- Risk assessment

## ⚠️ Disclaimers

### Financial Risk
- Cryptocurrency trading involves significant risk
- Only trade with money you can afford to lose
- Past performance does not guarantee future results
- This bot is for educational purposes

### Technical Risk
- Software bugs may cause unexpected behavior
- API failures can disrupt trading
- Network issues may affect performance
- Always monitor the bot actively

### Legal Compliance
- Ensure compliance with local regulations
- Understand tax implications
- Consider consulting financial advisors
- Use at your own risk

## 🤝 Support & Community

### Getting Help
1. Check this documentation first
2. Review log files for errors
3. Test with paper trading
4. Start with small amounts

### Contributing
- Report bugs via GitHub issues
- Suggest improvements
- Share successful strategies
- Help improve documentation

## 📝 License

MIT License - See LICENSE file for details.

---

**Happy Trading! 🚀📈**

*Remember: Start with paper trading, use small amounts, and always monitor your bot actively.*
