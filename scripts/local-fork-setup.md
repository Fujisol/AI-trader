# Local Fork Setup Guide

## 1. Fork

```bash
git clone <your-fork-url>
cd AI-trader
```

## 2. Create Local Environment File

Create `.env` (NOT committed):

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TRADING_MODE=paper
API_KEY=<generate_secure_key>
```

Add additional keys only as needed.

## 3. (Option A) Use Local Postgres/Redis via Docker

```bash
LOCAL_DB_PASSWORD=devpass docker compose up -d --build
```

Backend accessible: <http://localhost:8080>

To use container Postgres:

```bash
DATABASE_URL=postgresql://postgres:devpass@localhost:5433/ai_trader
```

## 4. (Option B) Use Supabase

Create new Supabase project -> get URL + anon key. Add to `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_DB_PASSWORD=<db_pass_if_needed>
DATABASE_URL=postgresql://postgres:<db_pass>@db.<project>.supabase.co:5432/postgres
```

Run migrations in Supabase SQL:

- db/migrations/001_schema_constraints.sql
- dashboard/supabase-rls-hardening.sql (leave Phase 2 commented until auth ready)

## 5. Install & Run (non-docker)

```bash
npm install
npm start
```

Dashboard (if separate) start in second terminal:

```bash
cd dashboard && npm start
```

## 6. Test Proxy Endpoints

Set `API_KEY` in `.env`. Then:

```bash
curl -X POST http://localhost:8080/api/proxy/trades \
  -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"token":"SOL","status":"open","timestamp":1699999999999,"pnl":0}'
```

## 7. Frontend Adjustments

Point frontend calls to `/api/proxy/...` instead of direct Supabase REST for writes.

## 8. History Reset (Optional Clean Slate)

```bash
git checkout --orphan clean-main
git add .
git commit -m "chore: baseline after secret purge"
git push origin clean-main
```

Then set `clean-main` as default branch in GitHub settings and archive/delete old `main` after confirming secrets purged.

## 9. Next Steps

- Implement auth (JWT / Supabase Auth) -> Phase 2 RLS
- Add rate limiting + Helmet
- Add monitoring (winston + health probe)

---
Generated automatically for fork usage.
