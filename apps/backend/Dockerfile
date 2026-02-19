FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
COPY apps/backend/package.json ./
RUN npm install --production=false

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend/ ./
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 5000
CMD ["node", "dist/index.js"]
