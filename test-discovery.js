const axios = require('axios');

async function triggerDiscovery() {
  console.log('🚀 Triggering Enhanced Token Discovery...\n');
  
  try {
    // Test the enhanced discovery endpoints
    console.log('📊 Checking discovered tokens...');
    const tokensRes = await axios.get('http://localhost:8080/api/discovery/tokens');
    console.log(`Found: ${tokensRes.data.data.count} discovered tokens`);
    
    console.log('\n👑 Checking high-performance traders...');
    const tradersRes = await axios.get('http://localhost:8080/api/discovery/traders');
    console.log(`Found: ${tradersRes.data.data.count} high-performance traders`);
    
    console.log('\n🎯 Checking advanced signals...');
    const signalsRes = await axios.get('http://localhost:8080/api/signals/advanced');
    console.log('Signals summary:', signalsRes.data.summary);
    
    console.log('\n💰 Current portfolio status...');
    const statusRes = await axios.get('http://localhost:8080/api/status');
    console.log(`SOL Balance: ${statusRes.data.walletBalance.sol}`);
    console.log(`Token positions: ${Object.keys(statusRes.data.walletBalance.tokens).length}`);
    
    console.log('\n📈 Copy trading stats...');
    const copyRes = await axios.get('http://localhost:8080/api/copy-trading/stats');
    console.log('Copy trading active:', copyRes.data);
    
    console.log('\n✅ Enhanced AI Trading Bot is running and discovering!');
    console.log('🌐 Dashboard: http://localhost:3000');
    console.log('🔗 API: http://localhost:8080');
    
  } catch (error) {
    console.error('❌ Error testing discovery:', error.message);
  }
}

// Run discovery test
triggerDiscovery();
