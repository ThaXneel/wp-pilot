FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY services/proxy-layer/package.json ./
RUN npm install --production=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY services/proxy-layer/ ./
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 4000
CMD ["node", "dist/index.js"]
