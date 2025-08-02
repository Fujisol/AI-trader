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

// Validate required environment variables
const requiredEnvVars = [
  'SOLANA_RPC_URL',
  'TRADING_MODE'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Start the main application
console.log('🚀 Starting AI Crypto Trading Bot...');
console.log(`📊 Trading Mode: ${process.env.TRADING_MODE}`);
console.log(`🌐 RPC URL: ${process.env.SOLANA_RPC_URL}`);

require('./src/index.js');
