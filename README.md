# Veda AI

Premium college enquiry companion built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and OpenAI.

## What Is Implemented

- Glass-Zen design system with:
	- `backdrop-filter: blur(20px)` panels (`bg-white/10` style)
	- iridescent razor-thin gradient border
- Nebula Chat with multi-turn conversation support
- Verification-first response flow for fees/deadlines:
  - every fees/deadlines answer includes `last_verified` and source links
  - stale records (>7 days) include a visible `Verification Warning`
- MCP/OpenAI backend adapter (`MCP_OPENAI_BASE_URL` + `OPENAI_API_KEY`)
- Weekly Impact toast using Efficiency Gain:

$$
	ext{Efficiency Gain} = \frac{\text{Manual Hours} - \text{Veda Hours}}{\text{Manual Hours}} \times 100
$$

- Fee shortlist compare panel for side-by-side TCOA (3 institutions)
- Vibe Pulse SVG that reacts to AI state (`thinking` vs `ready`)
- 44px minimum touch targets on interactive controls
- Lazy-loaded mesh background for improved LCP
- Google-only authentication (NextAuth + Prisma adapter)
- Team-based admin access with manual institution verification CRUD
- Daily user quota: 50 questions/day
- Vercel KV caching for repeated queries
- Postgres/Prisma-backed institution store + verification logs

## Environment

Copy `.env.example` values into your environment:

- `DATABASE_URL` Postgres connection string
- `OPENAI_API_KEY` required for live model responses
- `OPENAI_MODEL` optional (default: `gpt-4.1-mini`)
- `MCP_OPENAI_BASE_URL` optional for routing through an MCP/OpenAI-compatible gateway
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `TEAM_ADMIN_EMAILS` comma-separated emails promoted to admin on first login
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` for Vercel KV (Upstash)

## Database Setup

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Use `npm run db:migrate` if you want migration files for team workflows.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

- `POST /api/chat`
	- Requires Google session
	- Enforces 50 questions per user/day
	- Input: `{ messages: [{ role: "user" | "assistant", content: string }] }`
	- Output: `{ reply, status, verification[], verificationWarning?, efficiency? }`
- `GET /api/institutions`
	- Returns institution rows used in shortlist comparison
- `GET/POST /api/admin/institutions`
- `PATCH/DELETE /api/admin/institutions/[id]`
- `GET/POST /api/admin/team/members`
- `GET /api/health`

## Production Notes

- Rotate any exposed API key immediately and use only fresh keys in Vercel environment variables.
- Deploy on Vercel Node runtime with all environment values configured.
- Visit `/admin` after Google sign-in to manage institution verification records.
- Run `npm run smoke:prod` with `APP_URL` set to your deployed domain.

## Deployment Runbook

See `DEPLOY_VERCEL.md` for the full production checklist.

## Contribution Activity Log
- Activity 1: docs touch-up on 2026-04-23T22:36:24Z
- Activity 2: docs touch-up on 2026-04-23T22:36:30Z
- Activity 3: docs touch-up on 2026-04-23T22:36:35Z
- Activity 4: docs touch-up on 2026-04-23T22:36:41Z
- Activity 5: docs touch-up on 2026-04-23T22:36:46Z
- Activity 6: docs touch-up on 2026-04-23T22:36:52Z
- Activity 7: docs touch-up on 2026-04-23T22:36:57Z
- Activity 8: docs touch-up on 2026-04-23T22:37:02Z
- Activity 9: docs touch-up on 2026-04-23T22:37:08Z
