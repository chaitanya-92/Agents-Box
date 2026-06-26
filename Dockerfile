FROM node:22-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install --include=dev

# 1. Build workspace config package (API imports @agentverse/config at runtime)
RUN node_modules/.bin/tsc -p packages/config/tsconfig.json

# 2. Generate Prisma client
RUN node_modules/.bin/prisma generate

# 3. Bundle API — esbuild resolves @/ aliases, externalises node_modules
#    @agentverse/config is in node_modules as a symlink → packages/config/dist (built above)
RUN node_modules/.bin/esbuild apps/api/src/server.ts \
    --bundle \
    --packages=external \
    --platform=node \
    --format=esm \
    --outfile=apps/api/dist/server.js \
    --tsconfig=apps/api/tsconfig.json

RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
