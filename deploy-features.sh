#!/bin/bash
# Run this from your Terminal: bash ~/agentsstore/deploy-features.sh

set -e
cd ~/agentsstore

echo "🔓 Removing git locks..."
rm -f .git/index.lock .git/HEAD.lock

echo "📦 Staging files..."
git add \
  prisma/schema.prisma \
  "prisma/migrations/20240104000000_add_auth_features/migration.sql" \
  apps/api/src/lib/mailer.ts \
  apps/api/src/modules/auth/auth.controller.ts \
  apps/api/src/modules/billing/billing.controller.ts \
  apps/api/src/routes/auth.routes.ts \
  apps/api/src/routes/billing.routes.ts \
  apps/api/src/routes/index.ts \
  "apps/api/src/modules/admin/" \
  "apps/api/src/modules/apikeys/" \
  "apps/api/src/modules/conversations/" \
  apps/api/src/routes/admin.routes.ts \
  apps/api/src/routes/apikeys.routes.ts \
  apps/api/src/routes/conversations.routes.ts \
  apps/web/lib/api.ts \
  "apps/web/app/(app)/dashboard/page.tsx" \
  "apps/web/app/(app)/layout.tsx" \
  "apps/web/app/(app)/admin/" \
  "apps/web/app/(app)/api-keys/" \
  "apps/web/app/(app)/conversations/" \
  "apps/web/app/(app)/invoices/" \
  "apps/web/app/(auth)/forgot-password/" \
  "apps/web/app/(auth)/reset-password/" \
  "apps/web/app/(auth)/verify-email/" \
  "apps/web/app/(marketing)/privacy/" \
  "apps/web/app/(marketing)/terms/" \
  apps/web/components/layout/site-footer.tsx \
  apps/web/components/marketing/auth-form.tsx \
  apps/web/components/marketing/faq.tsx

echo "💾 Committing..."
git commit -m "feat: email verify, password reset, free trial, API keys, conversations, admin, accordion FAQ, invoices, terms/privacy

- Email verification on register (24h link) + sidebar resend banner
- Forgot password + reset password flow via email
- 7-day Pro free trial auto-created on every new signup
- API Keys page: generate/revoke, SHA-256 hashed storage, max 10 keys
- Conversation history: auto-save + list + delete
- Invoice history with per-payment PDF download
- Admin dashboard: stats, signups chart, user table (ADMIN role)
- Dashboard: upgrade nudge when >80% credits used + 7-day usage chart
- FAQ: accordion with smooth expand/collapse animation (was broken static)
- Terms of Service and Privacy Policy pages
- Footer: Terms/Privacy links
- Auth form: Forgot password link on login + post-register email-check screen
- Sidebar: History, Invoices, API Keys nav items; Admin link for admins
- Backend: /api-keys, /conversations, /admin, /billing/invoices routes added"

echo "🚀 Pushing to main..."
git push origin main

echo "✅ Done! Vercel will rebuild automatically."
echo ""
echo "⚠️  Also run the Render deploy trigger if needed:"
echo "   curl -X POST https://api.render.com/deploy/srv-YOUR_SERVICE_ID?key=YOUR_DEPLOY_KEY"
