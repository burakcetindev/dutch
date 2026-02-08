# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files ONLY (maximizes cache hit)
COPY package.json package-lock.json ./

# Install dependencies with persistent cache mount
# Cache survives between builds = instant installs on rebuild
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci

# Copy ONLY files needed for build (excludes tests, docs, etc per .dockerignore)
COPY . .

# Build with Next.js cache mount for faster rebuilds
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache \
    npm run build

# Production stage - minimal runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0"

# Create non-root user and directories with proper permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p .next input && \
    chown -R nextjs:nodejs .next input

# Copy standalone output (already includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
