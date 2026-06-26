FROM node:22-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install --include=dev

# Generate Prisma client (native binary — must stay external)
RUN node_modules/.bin/prisma generate

# Bundle entire API + all workspace packages into ONE file.
# esbuild resolves @/ aliases via tsconfig and inlines everything except @prisma/*
RUN node_modules/.bin/esbuild apps/api/src/server.ts \
    --bundle \
    --platform=node \
    --format=esm \
    --outfile=apps/api/dist/server.js \
    --tsconfig=apps/api/tsconfig.json \
    --external:@prisma/client \
    --external:@prisma/engines

RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
