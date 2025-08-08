const crypto = require('crypto');

// Simple API Key Auth Middleware
// Set API_KEY in environment for production use
const apiKeyAuth = (req, res, next) => {
  const configured = process.env.API_KEY;
  if (!configured) return res.status(503).json({ error: 'API key not configured' });
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key || key !== configured) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Utility to generate a random API key (not exposed by default)
function generateApiKey(length = 48) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = { apiKeyAuth, generateApiKey };
