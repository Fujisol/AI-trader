#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🤖 AI Crypto Trading Bot - Auto Setup Script');
console.log('===============================================\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion);

// Create required directories
const directories = [
  'logs',
  'data', 
  'backtest-results',
  'trade-history',
  'dashboard/public'
];

console.log('\n📁 Creating required directories...');
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✅ Created: ${dir}`);
  } else {
    console.log(`  ℹ️  Already exists: ${dir}`);
  }
});

// Copy environment file
console.log('\n⚙️  Setting up environment configuration...');
const envExample = path.join(__dirname, '.env.example');
const envFile = path.join(__dirname, '.env');

if (!fs.existsSync(envFile)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log('  ✅ Created .env file from .env.example');
    console.log('  ⚠️  Please edit .env file with your actual configuration!');
  } else {
    console.error('  ❌ .env.example file not found');
  }
} else {
  console.log('  ℹ️  .env file already exists');
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  console.log('  Installing npm packages...');
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('  ✅ Backend dependencies installed');
} catch (error) {
  console.error('  ❌ Failed to install backend dependencies:', error.message);
  process.exit(1);
}

// Install dashboard dependencies
console.log('\n📦 Installing dashboard dependencies...');
try {
  const dashboardPath = path.join(__dirname, 'dashboard');
  if (fs.existsSync(dashboardPath)) {
    console.log('  Installing dashboard npm packages...');
    execSync('npm install', { stdio: 'inherit', cwd: dashboardPath });
    console.log('  ✅ Dashboard dependencies installed');
  } else {
    console.log('  ⚠️  Dashboard directory not found, skipping...');
  }
} catch (error) {
  console.error('  ❌ Failed to install dashboard dependencies:', error.message);
  console.log('  💡 You can install them later with: cd dashboard && npm install');
}

// Create startup scripts
console.log('\n📝 Creating startup scripts...');

// Windows batch file
const windowsScript = `@echo off
echo Starting AI Crypto Trading Bot...
echo =====================================

echo Starting backend...
start "AI Trading Bot Backend" cmd /k "npm start"

timeout /t 3 /nobreak > nul

echo Starting dashboard...
start "AI Trading Bot Dashboard" cmd /k "cd dashboard && npm start"

echo.
echo Both services are starting...
echo Backend: http://localhost:8080
echo Dashboard: http://localhost:3000
echo.
echo Check the command windows for any errors.
pause
`;

// Unix shell script
const unixScript = `#!/bin/bash
echo "Starting AI Crypto Trading Bot..."
echo "====================================="

echo "Starting backend..."
npm start &
BACKEND_PID=$!

sleep 3

echo "Starting dashboard..."
cd dashboard && npm start &
DASHBOARD_PID=$!

echo ""
echo "Both services are starting..."
echo "Backend: http://localhost:8080"
echo "Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interrupt
trap 'kill $BACKEND_PID $DASHBOARD_PID; exit 0' INT
wait
`;

fs.writeFileSync(path.join(__dirname, 'start-bot.bat'), windowsScript);
fs.writeFileSync(path.join(__dirname, 'start-bot.sh'), unixScript);

// Make shell script executable on Unix systems
if (process.platform !== 'win32') {
  try {
    execSync('chmod +x start-bot.sh', { cwd: __dirname });
  } catch (error) {
    console.log('  ⚠️  Could not make start-bot.sh executable');
  }
}

console.log('  ✅ Created start-bot.bat (Windows)');
console.log('  ✅ Created start-bot.sh (Unix/Linux/Mac)');

// Check for optional dependencies
console.log('\n🔍 Checking optional services...');

// Check MongoDB
try {
  execSync('mongod --version', { stdio: 'ignore' });
  console.log('  ✅ MongoDB is installed');
} catch (error) {
  console.log('  ⚠️  MongoDB not found. Install from https://mongodb.com/try/download/community');
  console.log('     Or use a cloud MongoDB service like Atlas');
}

// Check Redis (optional)
try {
  execSync('redis-server --version', { stdio: 'ignore' });
  console.log('  ✅ Redis is installed');
} catch (error) {
  console.log('  ℹ️  Redis not found (optional). Install for better performance');
}

// Final instructions
console.log('\n🎉 Setup Complete!');
console.log('==================');
console.log('');
console.log('Next steps:');
console.log('1. Edit .env file with your configuration');
console.log('2. Start MongoDB if using local database');
console.log('3. Run the trading bot:');
console.log('   Windows: double-click start-bot.bat');
console.log('   Unix/Linux/Mac: ./start-bot.sh');
console.log('   Manual: npm start (backend) + cd dashboard && npm start');
console.log('');
console.log('💡 Important:');
console.log('- Start with TRADING_MODE=paper for testing');
console.log('- Read SETUP_GUIDE.md for detailed instructions');
console.log('- Only use real money after thorough testing');
console.log('');
console.log('🔗 URLs after starting:');
console.log('- Dashboard: http://localhost:3000');
console.log('- API: http://localhost:8080');
console.log('- Health check: http://localhost:8080/health');
console.log('');
console.log('Happy trading! 🚀📈');

console.log('\n⚠️  DISCLAIMER: This is educational software. Trade at your own risk!');
