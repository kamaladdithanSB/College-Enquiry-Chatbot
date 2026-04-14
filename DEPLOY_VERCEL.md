# Veda AI Vercel Deployment Runbook

## 1) Required Secrets in Vercel

Set these environment variables in Project Settings -> Environment Variables:

- DATABASE_URL
- OPENAI_API_KEY
- OPENAI_MODEL (optional, default gpt-4.1-mini)
- MCP_OPENAI_BASE_URL (optional)
- NEXTAUTH_URL (for production, set to your Vercel domain)
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- DEFAULT_TEAM_NAME (optional)
- DEFAULT_TEAM_SLUG (optional)
- TEAM_ADMIN_EMAILS (comma-separated)
- KV_REST_API_URL
- KV_REST_API_TOKEN

## 2) Google OAuth Setup

In Google Cloud Console OAuth client:

- Authorized redirect URI:
  - https://YOUR_DOMAIN/api/auth/callback/google
- Authorized JavaScript origin:
  - https://YOUR_DOMAIN

Use the same values in Vercel env vars.

## 3) Database Initialization

Run once after setting DATABASE_URL:

1. npm run db:generate
2. npm run db:push
3. npm run db:seed

## 4) Build And Deploy

1. npm run lint
2. npm run build
3. Deploy to Vercel (Git integration or vercel deploy)

## 5) Production Verification

Health endpoint:

- GET /api/health
- Expect checks.env = ok and checks.database = ok

Smoke run from local terminal:

1. set APP_URL=https://YOUR_DOMAIN
2. npm run smoke:prod

## 6) Admin Validation

1. Sign in with Google
2. Visit /admin
3. Add one institution and verify it appears in list
4. Ask chat a fee/deadline question and confirm:
   - source link appears
   - last_verified appears
   - stale records show Verification Warning

## 7) Go-Live Guardrails

- Rotate any leaked OpenAI key before go-live
- Keep TEAM_ADMIN_EMAILS restricted
- Monitor request volume for /api/chat and adjust quota only after observing real traffic
