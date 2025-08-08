const fetch = require('node-fetch');
const Logger = require('../utils/Logger');

class SupabaseProxy {
  constructor() {
    this.logger = new Logger('SupabaseProxy');
    this.url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`
    };
  }

  async saveUser(userData) {
    const res = await fetch(`${this.url}/rest/v1/users`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ ...userData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('Supabase saveUser failed');
    return res.json();
  }

  async getUser(email) {
    const res = await fetch(`${this.url}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, { headers: this._headers() });
    if (!res.ok) throw new Error('Supabase getUser failed');
    const data = await res.json();
    return data[0] || null;
  }

  async saveTrade(trade) {
    const res = await fetch(`${this.url}/rest/v1/trades`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ ...trade, created_at: new Date().toISOString(), database_provider: 'supabase' })
    });
    if (!res.ok) throw new Error('Supabase saveTrade failed');
    return res.json();
  }

  async getTrades(limit = 50) {
    const res = await fetch(`${this.url}/rest/v1/trades?order=created_at.desc&limit=${limit}`, { headers: this._headers() });
    if (!res.ok) throw new Error('Supabase getTrades failed');
    return res.json();
  }

  async saveSettings(userId, settings) {
    const res = await fetch(`${this.url}/rest/v1/user_settings`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ user_id: userId, settings, updated_at: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('Supabase saveSettings failed');
    return res.json();
  }

  async getSettings(userId) {
    const res = await fetch(`${this.url}/rest/v1/user_settings?user_id=eq.${encodeURIComponent(userId)}`, { headers: this._headers() });
    if (!res.ok) throw new Error('Supabase getSettings failed');
    const data = await res.json();
    return data[0]?.settings || null;
  }
}

module.exports = SupabaseProxy;
