const winston = require('winston');

class Logger {
  constructor(module = 'AI-Trader') {
    this.module = module;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, module: logModule, ...meta }) => {
          const moduleStr = logModule || this.module;
          return `${timestamp} [${level.toUpperCase()}] [${moduleStr}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        })
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, { module: this.module, ...meta });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { module: this.module, ...meta });
  }

  error(message, meta = {}) {
    this.logger.error(message, { module: this.module, ...meta });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, { module: this.module, ...meta });
  }
}

module.exports = Logger;
