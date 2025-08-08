# 🤖 AI Crypto Trading Bot

Advanced AI-powered cryptocurrency trading system with memecoin sniping, copy trading, and comprehensive risk management on Solana.

## 🔐 Security & Secrets

- Do NOT commit `.env` (use `.env.example` as template)
- All secrets must be stored in Netlify / hosting provider env settings
- Rotate exposed keys immediately if leaked
- Supports dual DB: Supabase PostgreSQL (preferred) / MongoDB fallback

## 🔄 Secret Rotation Workflow

1. Regenerate keys in provider dashboards (Supabase, Twitter, Telegram, etc.)
2. Update Netlify environment variables
3. Update local untracked `.env`
4. (Optional) Purge old secrets from git history (filter-repo / BFG)
5. Redeploy

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
- 🔥 **Trending topic detection** for early opportunities
- 📈 **Performance analytics** with comprehensive reporting

### 🛡️ Safety & Security

- 📝 **Paper trading mode** for risk-free testing
- 🛑 **Emergency stop systems** for loss protection
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
DATABASE_URL=postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.<YOUR_PROJECT>.supabase.co:5432/postgres

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

- 🌐 **Dashboard**: [http://localhost:3000](http://localhost:3000)
- 🔧 **API**: [http://localhost:8080](http://localhost:8080)
- ❤️ **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

## 📊 System Architecture

```text
src/
├── agents/          # AI trading agents
├── config/          # Configuration files
├── services/        # External service integrations
├── utils/           # Helper utilities
├── models/          # Data models
├── strategies/      # Trading strategies
└── api/             # REST API endpoints

dashboard/           # React dashboard
data/                # Historical data storage
logs/                # Application logs
```

## Environment Variables Overview

See `.env.example` for required environment variables including:

- Solana wallet private key
- Twitter API credentials
- News API keys
- Supabase connections (preferred) / MongoDB fallback

## Safety Notice

⚠️ **Important**: This bot trades with real money. Always:

- Test with small amounts first
- Set proper risk limits
- Monitor the bot actively
- Keep backups of your wallet keys

## License

MIT License - see LICENSE file for details.
