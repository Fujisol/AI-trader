/**
 * Centralized environment variable validation
 * - Separates required minimal vars from optional feature flags
 * - Warns (does not exit) for optional integrations when missing
 */

const REQUIRED = [
  'SOLANA_RPC_URL',
  'TRADING_MODE'
];

const OPTIONAL = {
  SUPABASE: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_DB_PASSWORD', 'DATABASE_URL'],
  TWITTER: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_BEARER_TOKEN'],
  TELEGRAM: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
  NEWS: ['NEWS_API_KEY', 'ALPHA_VANTAGE_KEY'],
  BIRDEYE: ['BIRDEYE_API_KEY']
};

function validateEnv() {
  const missingRequired = REQUIRED.filter(k => !process.env[k]);
  if (missingRequired.length) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  const warnings = [];
  for (const [feature, keys] of Object.entries(OPTIONAL)) {
    const missing = keys.filter(k => !process.env[k]);
    if (missing.length === keys.length) {
      warnings.push(`⚠️  ${feature} integration disabled (missing all keys: ${keys.join(', ')})`);
    }
  }

  if (warnings.length) {
    console.log('🔧 Optional integrations summary:');
    warnings.forEach(w => console.log(w));
  }

  // Basic sanity checks
  if (process.env.TRADING_MODE && !['paper', 'live'].includes(process.env.TRADING_MODE)) {
    console.log('⚠️  TRADING_MODE should be either "paper" or "live". Defaulting to paper.');
    process.env.TRADING_MODE = 'paper';
  }

  return true;
}

module.exports = validateEnv;
