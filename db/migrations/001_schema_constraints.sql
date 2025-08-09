-- Migration 001: Add constraints, enums, indexes for core tables
-- Safe to run multiple times (idempotent where possible)

-- 1. Enum for trade status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_status') THEN
        CREATE TYPE trade_status AS ENUM ('open','closed','pending');
    END IF;
END $$;

-- 2. Add columns / convert status
ALTER TABLE trades
    ADD COLUMN IF NOT EXISTS status_enum trade_status,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Backfill status_enum from status text if present
UPDATE trades SET status_enum = CASE
    WHEN status IN ('open','closed','pending') THEN status::trade_status
    ELSE 'pending'::trade_status END
WHERE status_enum IS NULL;

-- 4. Set NOT NULLs (comment out if data dirty)
ALTER TABLE trades
    ALTER COLUMN status_enum SET NOT NULL,
    ALTER COLUMN token SET NOT NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS trades_token_ts_idx ON trades(token, timestamp DESC);
CREATE INDEX IF NOT EXISTS trades_status_idx ON trades(status_enum);

-- 6. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trades_updated_at ON trades;
CREATE TRIGGER trg_trades_updated_at
BEFORE UPDATE ON trades
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- 7. Future: remove old status text column after ensuring no code depends on it
-- ALTER TABLE trades DROP COLUMN status; -- (Do later after code change)

-- 8. Positions table constraints (if exists)
ALTER TABLE positions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS positions_token_ts_idx ON positions(token, timestamp DESC);

DROP TRIGGER IF EXISTS trg_positions_updated_at ON positions;
CREATE TRIGGER trg_positions_updated_at
BEFORE UPDATE ON positions
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- 9. User settings normalization (optional stub)
ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- End Migration 001
