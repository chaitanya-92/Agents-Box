FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
RUN npm install --workspaces

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build --workspace @agentverse/config
RUN npm run build --workspace @agentverse/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/config/dist ./packages/config/dist
COPY --from=build /app/packages/config/package.json ./packages/config/package.json
COPY --from=build /app/prisma ./prisma
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]

