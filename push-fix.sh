#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "↩️  Resetting the 2 blocked commits (keeping all file changes)..."
git reset --soft HEAD~2

echo "📝 Restaging with clean do-it.mjs (secrets in .env.deploy instead)..."
git add Dockerfile .gitignore do-it.mjs package.json package-lock.json
# .env.deploy is gitignored — stays local only

echo "✅ Committing..."
git commit -m "fix: Dockerfile node:22-slim for Prisma + move secrets to .env.deploy"

echo "🚀 Pushing..."
git push origin main

echo ""
echo "Done! Now run: node ~/agentsstore/do-it.mjs"
