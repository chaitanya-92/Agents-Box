#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "🔓 Removing git lock..."
rm -f .git/index.lock

echo "📦 Committing staged changes..."
git add -A
git commit -m "chore: production deployment wiring

- render.yaml: Render Docker web service config
- packages/config: compile to dist for Node.js runtime
- apps/api/Dockerfile: build config before API, copy only dist in runner
- apps/web/vercel.json: monorepo install/build commands
- .github/workflows/ci.yml: typecheck CI + Vercel deploy on main
- package.json: build config first in all scripts"

echo "🔀 Merging into main..."
git checkout main
git merge codex-prod-auth-billing-deploy --no-ff -m "merge: codex-prod-auth-billing-deploy → main"

echo "⬆️  Pushing main..."
git push origin main

echo "🔀 Also pushing feature branch..."
git push origin codex-prod-auth-billing-deploy

echo ""
echo "✅ Git done. Triggering Render deploy..."
node fix-render-deploy.mjs

echo ""
echo "🎉 All done!"
echo "   Frontend: https://agentverse-ai-web.vercel.app"
echo "   Backend:  https://agentverse-api.onrender.com/api/v1/health"
