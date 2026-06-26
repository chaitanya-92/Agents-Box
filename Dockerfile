FROM node:22-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install --include=dev

RUN node_modules/.bin/prisma generate

# CJS bundle — handles dynamic require() from dotenv and other packages
RUN node_modules/.bin/esbuild apps/api/src/server.ts \
    --bundle \
    --platform=node \
    --format=cjs \
    --outfile=apps/api/dist/server.cjs \
    --tsconfig=apps/api/tsconfig.json \
    --external:@prisma/client \
    --external:@prisma/engines

# NOTE: no npm prune — keeps Prisma query engine binaries intact

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/server.cjs"]
