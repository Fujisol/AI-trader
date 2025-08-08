-- Supabase RLS Hardening Script
-- Safe to run in SQL Editor. Adjust as needed.
-- Phased approach: Phase 0 (current permissive), Phase 1 (read-harden), Phase 2 (full auth).

-- =============================
-- 0. PREP & CLEANUP
-- =============================
-- Drop overly permissive policies if they exist (ignore errors)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('users','trades','user_settings','copy_wallets','positions')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Ensure RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- =============================
-- 1. OPTIONAL SCHEMA TIGHTENING (idempotent)
-- =============================
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id uuid; -- for future auth.users link
ALTER TABLE positions ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS user_id uuid;

-- Basic NOT NULL constraints (only if data already conforms)
-- COMMENT OUT if you still have null data
-- ALTER TABLE trades ALTER COLUMN status SET NOT NULL;
-- ALTER TABLE trades ALTER COLUMN token SET NOT NULL;

-- =============================
-- 2. SUPPORT FUNCTIONS
-- =============================
-- Helper to detect admin role via JWT claim (requires custom JWT claim 'role')
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('request.jwt.claim.role', true) = 'admin', false);
$$;

-- =============================
-- 3. PHASE 1 POLICIES (No Supabase Auth yet) 
--    - Allows read for everyone
--    - Restricts writes to nothing (except we keep trades insert open temporarily if needed)
--    Replace WHEN ready for Phase 2.
-- =============================

-- USERS: read-only public (for now), no writes
CREATE POLICY users_select_public ON users FOR SELECT USING (true);
-- (Disable inserts/updates until auth in place)

-- COPY_WALLETS: public read only
CREATE POLICY copy_wallets_select_public ON copy_wallets FOR SELECT USING (true);

-- TRADES: allow public read, TEMPORARY open insert (will be replaced)
CREATE POLICY trades_select_public ON trades FOR SELECT USING (true);
CREATE POLICY trades_temp_insert_public ON trades FOR INSERT WITH CHECK (true);

-- POSITIONS: public read only (no writes)
CREATE POLICY positions_select_public ON positions FOR SELECT USING (true);

-- USER_SETTINGS: no access without auth yet (block all)
CREATE POLICY user_settings_block_all_select ON user_settings FOR SELECT USING (false);
CREATE POLICY user_settings_block_all_mod ON user_settings FOR ALL USING (false) WITH CHECK (false);

-- =============================
-- 4. PHASE 2 POLICIES (AUTHENTICATED MODEL)
--    Activate AFTER enabling Supabase Auth and issuing JWTs.
--    Steps: Comment out Phase 1 policies and UNCOMMENT Phase 2 below.
-- =============================
/*
-- Drop Phase 1 policies manually then run:
DROP POLICY trades_temp_insert_public ON trades;

-- USERS: each user sees own row; admins see all
CREATE POLICY users_select_self ON users FOR SELECT USING ( is_admin() OR email = current_setting('request.jwt.claim.email', true) );
CREATE POLICY users_insert_self ON users FOR INSERT WITH CHECK ( email = current_setting('request.jwt.claim.email', true) );
CREATE POLICY users_update_self ON users FOR UPDATE USING ( is_admin() OR email = current_setting('request.jwt.claim.email', true) );

-- TRADES: owner or admin
CREATE POLICY trades_select_owner ON trades FOR SELECT USING ( is_admin() OR user_email = current_setting('request.jwt.claim.email', true) );
CREATE POLICY trades_insert_owner ON trades FOR INSERT WITH CHECK ( user_email = current_setting('request.jwt.claim.email', true) );
CREATE POLICY trades_update_owner ON trades FOR UPDATE USING ( is_admin() OR user_email = current_setting('request.jwt.claim.email', true) );

-- POSITIONS
CREATE POLICY positions_select_owner ON positions FOR SELECT USING ( is_admin() OR user_email = current_setting('request.jwt.claim.email', true) );
CREATE POLICY positions_insert_owner ON positions FOR INSERT WITH CHECK ( user_email = current_setting('request.jwt.claim.email', true) );
CREATE POLICY positions_update_owner ON positions FOR UPDATE USING ( is_admin() OR user_email = current_setting('request.jwt.claim.email', true) );

-- USER_SETTINGS
CREATE POLICY user_settings_select_owner ON user_settings FOR SELECT USING ( is_admin() OR user_id = auth.uid() );
CREATE POLICY user_settings_upsert_owner ON user_settings FOR INSERT WITH CHECK ( user_id = auth.uid() );
CREATE POLICY user_settings_update_owner ON user_settings FOR UPDATE USING ( is_admin() OR user_id = auth.uid() );

-- COPY_WALLETS: still public read
CREATE POLICY copy_wallets_select_public ON copy_wallets FOR SELECT USING (true);
*/

-- =============================
-- 5. VERIFICATION QUERIES
-- =============================
-- List policies
-- SELECT * FROM pg_policies WHERE schemaname='public';
-- Test insert (Phase 1): INSERT INTO trades (token,status,timestamp,pnl,user_email) VALUES ('SOL','open',extract(epoch from now())*1000,0,'test@example.com');
-- After Phase 2 + auth: same insert must include JWT with matching email claim.

-- =============================
-- END
