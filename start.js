#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Ensure required directories exist
const requiredDirs = [
  'logs',
  'data',
  'backtest-results',
  'trade-history'
];

for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

// Check environment file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Please copy .env.example to .env and configure your settings.');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Centralized environment validation
try {
  const validateEnv = require('./src/utils/envValidator');
  validateEnv();
} catch (e) {
  console.error('❌ Environment validation failed.');
  console.error(e.message || e);
  process.exit(1);
}

// Start the main application
console.log('🚀 Starting AI Crypto Trading Bot...');
console.log(`📊 Trading Mode: ${process.env.TRADING_MODE}`);
console.log(`🌐 RPC URL: ${process.env.SOLANA_RPC_URL}`);

require('./src/index.js');
