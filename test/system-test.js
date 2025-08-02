const axios = require('axios');
const Logger = require('../src/utils/Logger');
const MemeStrategy = require('../src/strategies/MemeStrategy');
const BacktestEngine = require('../src/utils/BacktestEngine');
const config = require('../src/config/config');

class SystemTest {
  constructor() {
    this.logger = new Logger('SystemTest');
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting AI Trading Bot System Tests');
    console.log('=======================================\n');

    try {
      await this.testConfigLoading();
      await this.testMemeStrategy();
      await this.testBacktestEngine();
      await this.testAPIConnections();
      await this.testPriceFeeds();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testConfigLoading() {
    console.log('📋 Testing configuration loading...');
    
    try {
      // Test config structure
      this.assert(config.trading, 'Trading config exists');
      this.assert(config.analysis, 'Analysis config exists');
      this.assert(config.social, 'Social config exists');
      this.assert(config.market, 'Market config exists');
      
      // Test trading parameters
      this.assert(config.trading.maxPositionSize > 0, 'Max position size is valid');
      this.assert(config.trading.stopLossPercentage > 0, 'Stop loss percentage is valid');
      this.assert(config.trading.memecoin, 'Memecoin config exists');
      
      this.addTestResult('Config Loading', true, 'All configurations loaded successfully');
      
    } catch (error) {
      this.addTestResult('Config Loading', false, error.message);
    }
  }

  async testMemeStrategy() {
    console.log('🎯 Testing memecoin strategy...');
    
    try {
      const strategy = new MemeStrategy(config);
      
      // Test with mock memecoin data
      const mockToken = {
        symbol: 'DOGE',
        name: 'Dogecoin',
        current_price: 0.1,
        price_change_percentage_24h: 25,
        market_cap: 2000000,
        total_volume: 500000
      };
      
      const mockSocialData = {
        socialData: {
          twitterMentions: {
            'doge': [
              { sentiment: { comparative: 0.3 } },
              { sentiment: { comparative: 0.2 } }
            ]
          },
          trendingTopics: [
            { name: 'doge', volume: 1000 }
          ]
        }
      };
      
      const analysis = strategy.analyze(mockToken, {}, mockSocialData);
      
      this.assert(analysis.confidence !== undefined, 'Strategy returns confidence score');
      this.assert(analysis.signals.length > 0, 'Strategy generates signals');
      this.assert(analysis.confidence >= 0 && analysis.confidence <= 1, 'Confidence is in valid range');
      
      // Test position sizing
      const positionSize = strategy.getPositionSize(0.8, 1000);
      this.assert(positionSize > 0, 'Position sizing works');
      this.assert(positionSize <= config.trading.memecoin.maxPositionSize, 'Position size respects limits');
      
      this.addTestResult('Meme Strategy', true, 'Strategy analysis working correctly');
      
    } catch (error) {
      this.addTestResult('Meme Strategy', false, error.message);
    }
  }

  async testBacktestEngine() {
    console.log('📊 Testing backtest engine...');
    
    try {
      const engine = new BacktestEngine();
      const strategy = new MemeStrategy(config);
      
      // Generate test data
      const historicalData = engine.generateHistoricalData('TEST', 7);
      this.assert(historicalData.length > 0, 'Historical data generated');
      
      // Run mini backtest
      const results = await engine.runBacktest(strategy, historicalData, {
        initialCash: 1000,
        symbol: 'TEST',
        minConfidence: 0.7,
        maxPositions: 3
      });
      
      this.assert(results.summary, 'Backtest returns summary');
      this.assert(results.trades, 'Backtest returns trade history');
      this.assert(results.summary.finalValue > 0, 'Final portfolio value is positive');
      
      engine.clearResults();
      
      this.addTestResult('Backtest Engine', true, 'Backtesting functionality working');
      
    } catch (error) {
      this.addTestResult('Backtest Engine', false, error.message);
    }
  }

  async testAPIConnections() {
    console.log('🌐 Testing API connections...');
    
    const apiTests = [
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/ping',
        expected: 'gecko_says'
      },
      {
        name: 'Solana RPC',
        url: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        method: 'POST',
        data: {
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        }
      }
    ];
    
    for (const test of apiTests) {
      try {
        const response = await axios({
          method: test.method || 'GET',
          url: test.url,
          data: test.data,
          timeout: 5000
        });
        
        if (test.expected && !JSON.stringify(response.data).includes(test.expected)) {
          throw new Error(`Unexpected response from ${test.name}`);
        }
        
        this.addTestResult(`${test.name} API`, true, 'Connection successful');
        
      } catch (error) {
        this.addTestResult(`${test.name} API`, false, error.message);
      }
    }
  }

  async testPriceFeeds() {
    console.log('💰 Testing price feeds...');
    
    try {
      // Test CoinGecko price fetch
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin,ethereum,solana',
          vs_currencies: 'usd'
        },
        timeout: 5000
      });
      
      this.assert(response.data.bitcoin, 'Bitcoin price available');
      this.assert(response.data.ethereum, 'Ethereum price available');
      this.assert(response.data.solana, 'Solana price available');
      
      this.assert(response.data.bitcoin.usd > 0, 'Bitcoin price is positive');
      this.assert(response.data.ethereum.usd > 0, 'Ethereum price is positive');
      this.assert(response.data.solana.usd > 0, 'Solana price is positive');
      
      this.addTestResult('Price Feeds', true, 'Price data retrieval working');
      
    } catch (error) {
      this.addTestResult('Price Feeds', false, error.message);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  addTestResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📋 Test Results Summary');
    console.log('=======================');
    
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`\nPassed: ${passedTests}/${totalTests} tests`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! System is ready to use.');
    } else {
      console.log('⚠️  Some tests failed. Please check configuration and dependencies.');
    }
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });

    console.log('\n💡 Next Steps:');
    if (passedTests === totalTests) {
      console.log('1. Edit .env file with your API keys');
      console.log('2. Start with TRADING_MODE=paper');
      console.log('3. Run: npm start');
      console.log('4. Open dashboard: http://localhost:3000');
    } else {
      console.log('1. Fix any failed tests');
      console.log('2. Check your internet connection');
      console.log('3. Verify API endpoints are accessible');
      console.log('4. Re-run tests: npm run test-system');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SystemTest();
  tester.runAllTests().catch(console.error);
}

module.exports = SystemTest;
