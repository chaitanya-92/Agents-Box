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
3. Run Prisma migrations.
4. Start the frontend and API separately.

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev:web
npm run dev:api
```

## Notes

- The UI intentionally follows a retro terminal-grid aesthetic inspired by your reference while adapting it to an AI agent marketplace.
- New agents can be added by updating `packages/config/agents.ts` without touching the rendering logic.

