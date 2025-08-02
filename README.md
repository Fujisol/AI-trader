# 🤖 AI Crypto Trading Bot

Advanced AI-powered cryptocurrency trading system with memecoin sniping, copy trading, and comprehensive risk management on Solana.

## ✨ Complete Features

### 💰 Trading Capabilities
- 🤖 **AI-powered market analysis** with pattern recognition
- 💎 **Memecoin sniping** based on social trends and viral signals
- 🔄 **Copy trading** from successful on-chain wallets
- 📊 **Technical analysis** with RSI, MACD, support/resistance
- ⚡ **Real-time trading** with Jupiter DEX integration
- 🛡️ **Advanced risk management** and position sizing

### 🧠 Intelligence Systems
- 🐦 **Social sentiment monitoring** (Twitter/X analysis)
- 📰 **News correlation** and market event analysis
- � **Influencer tracking** with weighted signals
- 🔥 **Trending topic detection** for early opportunities
- 📈 **Performance analytics** with comprehensive reporting

### 🛡️ Safety & Security
- 📝 **Paper trading mode** for risk-free testing
- � **Emergency stop systems** for loss protection
- 🎯 **Position limits** and portfolio risk management
- 📊 **Real-time monitoring** with Telegram alerts
- 🔐 **Secure wallet management** with multiple safety layers

## 🚀 Quick Start

### Installation
```bash
# Run the automated setup
npm run setup

# This will:
# - Install all dependencies
# - Create required directories
# - Set up configuration files
# - Check system requirements
```

### Configuration
```bash
# Edit your environment settings
nano .env

# Required settings:
TRADING_MODE=paper              # Start with paper trading!
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
MONGODB_URI=mongodb://localhost:27017/ai-crypto-trader

# Optional API keys for enhanced features:
TWITTER_BEARER_TOKEN=your_token
BIRDEYE_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_bot_token
```

### Launch
```bash
# Option 1: Use startup scripts
./start-bot.sh     # Linux/Mac
start-bot.bat      # Windows

# Option 2: Manual start
npm start                    # Backend (terminal 1)
cd dashboard && npm start    # Dashboard (terminal 2)
```

### Access
- 🌐 **Dashboard**: http://localhost:3000
- 🔧 **API**: http://localhost:8080
- ❤️ **Health Check**: http://localhost:8080/health

## 📊 System Architecture

```
src/
├── agents/          # AI trading agents
├── config/          # Configuration files
├── services/        # External service integrations
├── utils/           # Helper utilities
├── models/          # Data models
├── strategies/      # Trading strategies
└── api/            # REST API endpoints

dashboard/          # React dashboard
data/              # Historical data storage
logs/              # Application logs
```

## Configuration

See `.env.example` for required environment variables including:
- Solana wallet private key
- Twitter API credentials
- News API keys
- Database connections

## Safety Notice

⚠️ **Important**: This bot trades with real money. Always:
- Test with small amounts first
- Set proper risk limits
- Monitor the bot actively
- Keep backups of your wallet keys

## License

MIT License - see LICENSE file for details.
