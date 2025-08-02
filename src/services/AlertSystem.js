const { Telegraf } = require('telegraf');
const Logger = require('../utils/Logger');

class AlertSystem {
  constructor() {
    this.logger = new Logger('AlertSystem');
    this.alerts = [];
    this.bot = null;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
  }

  async initialize() {
    this.logger.info('🚨 Initializing Alert System...');
    
    if (process.env.TELEGRAM_BOT_TOKEN && 
        process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token' &&
        process.env.TELEGRAM_BOT_TOKEN.length > 20) {
      try {
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        
        this.bot.start((ctx) => {
          ctx.reply('🤖 AI Crypto Trading Bot Alert System activated!');
          this.logger.info(`Telegram bot started for chat ${ctx.chat.id}`);
        });
        
        // Launch bot without blocking initialization
        this.bot.launch().then(() => {
          this.logger.info('✅ Telegram alerts enabled');
        }).catch((error) => {
          this.logger.warn('⚠️ Failed to launch Telegram bot, alerts will be logged only');
          this.bot = null;
        });
        
      } catch (error) {
        this.logger.warn('⚠️ Failed to initialize Telegram bot (invalid token), alerts will be logged only');
        this.bot = null;
      }
    } else {
      this.logger.warn('⚠️ No valid Telegram token provided, alerts will be logged only');
    }
  }

  async sendAlert(type, title, message, data = {}) {
    const alert = {
      id: Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Log alert
    const logMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info';
    this.logger[logMethod](`🚨 ALERT [${type.toUpperCase()}] ${title}: ${message}`);
    
    // Send to Telegram if available
    if (this.bot && this.chatId) {
      await this.sendTelegramAlert(alert);
    }
    
    return alert;
  }

  async sendTelegramAlert(alert) {
    try {
      const emoji = this.getAlertEmoji(alert.type);
      const message = `${emoji} *${alert.title}*\n\n${alert.message}\n\n_${alert.timestamp}_`;
      
      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      this.logger.error('Failed to send Telegram alert:', error);
    }
  }

  getAlertEmoji(type) {
    const emojis = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      trade: '💰',
      profit: '📈',
      loss: '📉'
    };
    
    return emojis[type] || '🔔';
  }

  // Predefined alert methods
  async tradeExecuted(trade) {
    return this.sendAlert(
      'trade',
      'Trade Executed',
      `${trade.action.toUpperCase()} ${trade.token.symbol} for $${trade.size}`,
      trade
    );
  }

  async profitAlert(position) {
    return this.sendAlert(
      'profit',
      'Profit Achieved',
      `${position.token.symbol} position closed with $${position.pnl.toFixed(2)} profit`,
      position
    );
  }

  async lossAlert(position) {
    return this.sendAlert(
      'loss',
      'Stop Loss Triggered',
      `${position.token.symbol} position closed with $${position.pnl.toFixed(2)} loss`,
      position
    );
  }

  async riskAlert(message, data) {
    return this.sendAlert(
      'warning',
      'Risk Alert',
      message,
      data
    );
  }

  async systemAlert(message, type = 'info') {
    return this.sendAlert(
      type,
      'System Alert',
      message
    );
  }

  async opportunityAlert(opportunity) {
    return this.sendAlert(
      'info',
      'New Opportunity',
      `${opportunity.type} opportunity found: ${opportunity.token.symbol} (${(opportunity.confidence * 100).toFixed(1)}% confidence)`,
      opportunity
    );
  }

  async marketAlert(message, data) {
    return this.sendAlert(
      'info',
      'Market Alert',
      message,
      data
    );
  }

  async errorAlert(error, context) {
    return this.sendAlert(
      'error',
      'System Error',
      `Error in ${context}: ${error.message}`,
      { error: error.message, context }
    );
  }

  getRecentAlerts(limit = 20) {
    return this.alerts.slice(-limit).reverse();
  }

  getAlertsByType(type, limit = 20) {
    return this.alerts
      .filter(alert => alert.type === type)
      .slice(-limit)
      .reverse();
  }

  clearAlerts() {
    this.alerts = [];
    this.logger.info('🧹 Alerts cleared');
  }

  getAlertStats() {
    const stats = {};
    
    for (const alert of this.alerts) {
      stats[alert.type] = (stats[alert.type] || 0) + 1;
    }
    
    return {
      total: this.alerts.length,
      byType: stats,
      lastAlert: this.alerts.length > 0 ? this.alerts[this.alerts.length - 1] : null
    };
  }

  stop() {
    if (this.bot) {
      this.bot.stop();
      this.logger.info('🛑 Telegram bot stopped');
    }
  }
}

module.exports = AlertSystem;
