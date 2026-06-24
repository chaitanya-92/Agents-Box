# AgentVerse AI

AgentVerse AI is a full-stack SaaS platform for discovering, subscribing to, and using a modular catalog of AI agents.

## Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, React Hook Form, Zod
- Backend: Express.js, TypeScript, Prisma ORM, PostgreSQL
- Auth: JWT, Google OAuth
- Payments: Razorpay subscriptions, signature verification, webhook processing

## Workspace

- `apps/web`: App Router frontend
- `apps/api`: Express API
- `packages/config`: shared agent catalog and plan metadata
- `prisma`: Prisma schema

## Getting started

1. Install dependencies.
2. Copy `.env.example` to `.env` in the repo root and in apps as needed.
3. Run Prisma migrations or schema sync against PostgreSQL.
4. Start the frontend and API separately.

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev:web
npm run dev:api
```

## Notes

- The UI intentionally follows a retro terminal-grid aesthetic inspired by your reference while adapting it to an AI agent marketplace.
- New agents can be added by updating `packages/config/agents.ts` without touching the rendering logic.
- The primary database target is PostgreSQL. For hosted deployments, use a managed PostgreSQL provider such as Neon, Supabase, Railway, Render PostgreSQL, or RDS.

## Auth and payments setup

- Backend secrets go in the repo root `.env`.
- Frontend public keys go in `apps/web/.env.local`.
- For email/password auth, point `DATABASE_URL` to a real PostgreSQL instance and run `npx prisma db push` before registering users.
- With Supabase, use:
  - `DATABASE_URL` = pooled connection string for runtime
  - `DIRECT_URL` = direct database connection string for Prisma schema operations
- For Google OAuth, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in the root `.env`.
- Also set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"` in `apps/web/.env.local` only after the backend Google credentials are configured.
- For Razorpay:
  - Put `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in the root `.env`
  - Put `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `apps/web/.env.local`
  - Configure the webhook in Razorpay to hit `http://localhost:8080/api/v1/billing/webhook` during local testing

## Hosted setup

- Frontend domain example: `https://agentverse.ai`
- API domain example: `https://api.agentverse.ai`
- Set:
  - `APP_URL=https://agentverse.ai`
  - `API_URL=https://api.agentverse.ai`
  - `CORS_ORIGIN=https://agentverse.ai`
  - `GOOGLE_CALLBACK_URL=https://api.agentverse.ai/api/v1/auth/google/callback`
  - `NEXT_PUBLIC_API_URL=https://api.agentverse.ai/api/v1`
  - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`

## Recommended deployment split

- Frontend: Vercel
- API: Railway, Render, Fly.io, or a VPS with PM2
- Database: Supabase Postgres

This project is not structured as a single Vercel serverless app right now because the backend is a standalone Express service. The production-ready path is:

1. Deploy `apps/web` to Vercel
2. Deploy `apps/api` to a Node host using `npm run build --workspace @agentverse/api` and `npm run start --workspace @agentverse/api`, or use the included [apps/api/Dockerfile](/Users/chaitanya/agentsstore/apps/api/Dockerfile)
3. Point `NEXT_PUBLIC_API_URL` at the deployed API
4. Set Razorpay webhook to `https://api.your-domain.com/api/v1/billing/webhook`
