FROM node:22-slim
WORKDIR /app

# Prisma requires openssl on debian slim
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy all source
COPY . .

# Install all deps (include devDeps for build tools: tsc, tsc-alias, prisma)
RUN npm install --include=dev

# Build config package first (API imports from it)
RUN node_modules/.bin/tsc -p packages/config/tsconfig.json

# Generate Prisma client
RUN node_modules/.bin/prisma generate

# Build API
RUN node_modules/.bin/tsc -p apps/api/tsconfig.json
RUN node_modules/.bin/tsc-alias -p apps/api/tsconfig.json

# Prune devDeps for smaller image
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
