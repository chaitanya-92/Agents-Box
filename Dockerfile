FROM node:22-slim
WORKDIR /app

# Prisma needs openssl on debian slim
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy all source
COPY . .

# Install all deps (include dev for esbuild, prisma, typescript)
RUN npm install --include=dev

# Generate Prisma client
RUN node_modules/.bin/prisma generate

# Bundle API into single file — esbuild resolves @/ path aliases via tsconfig,
# --packages=external keeps node_modules as runtime deps (not inlined)
RUN node_modules/.bin/esbuild apps/api/src/server.ts \
    --bundle \
    --packages=external \
    --platform=node \
    --format=esm \
    --outfile=apps/api/dist/server.js \
    --tsconfig=apps/api/tsconfig.json

# Prune devDeps for smaller image
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
