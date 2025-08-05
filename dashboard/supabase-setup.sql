-- Create tables for AI Trading Dashboard
-- Run these commands in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    login_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50),
    token VARCHAR(50),
    user_email VARCHAR(255),
    price DECIMAL(20, 8),
    status VARCHAR(50),
    action VARCHAR(100),
    position_id VARCHAR(255),
    database_provider VARCHAR(50) DEFAULT 'supabase',
    created_at TIMESTAMP DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    settings JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy wallets table
CREATE TABLE IF NOT EXISTS copy_wallets (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    performance DECIMAL(10, 2),
    roi DECIMAL(10, 2),
    trades_count INTEGER DEFAULT 0,
    risk_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255),
    token VARCHAR(50),
    type VARCHAR(50), -- LONG/SHORT
    amount DECIMAL(20, 8),
    entry_price DECIMAL(20, 8),
    current_price DECIMAL(20, 8),
    pnl DECIMAL(20, 8),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert some sample copy trading wallets
INSERT INTO copy_wallets (wallet_address, name, performance, roi, trades_count, risk_level) VALUES
('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'DeFi Degen', 247.50, 24.96, 1247, 'HIGH'),
('3xP2M5qN8rK7vLbQwXzYtPmUwVcDsGhE6fJ9RsT4nW8X', 'Whale Tracker', 142.30, 18.45, 892, 'MEDIUM'),
('7vN4R8qL2mP6wKbXzQtYuJ5vDsGhE9rT3nW8xM1qN4pL', 'Solana Sniper', 89.75, 12.34, 567, 'HIGH'),
('2kL9R7qN6mP8wXbZtQyUj4vDsGhE1rT5nW3xM9qN7pLv', 'Pump Hunter', 356.20, 45.67, 2134, 'EXTREME'),
('5nW8xM3qN1pL7vR4qK2mP6wbZtYuJ9vDsE1rT8nW5xMq', 'Safe Gains', 67.80, 8.90, 234, 'LOW')
ON CONFLICT (wallet_address) DO NOTHING;

-- Enable Row Level Security (Optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON users FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON trades FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON trades FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON user_settings FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON user_settings FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON copy_wallets FOR SELECT USING (true);

CREATE POLICY "Public read access" ON positions FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON positions FOR UPDATE USING (true);
