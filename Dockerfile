# =============================================================================
# YoReservo BackOffice Web App (Next.js 16 Standalone) — Production Dockerfile
# =============================================================================

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# -----------------------------------------------------------------------------
# Builder Stage
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG ASSETS_BASE_URL=https://storage.yoreservo.nivis.cloud
ENV ASSETS_BASE_URL=${ASSETS_BASE_URL}

RUN npm run build

# -----------------------------------------------------------------------------
# Production Runner Stage
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/login || exit 1

CMD ["node", "server.js"]

