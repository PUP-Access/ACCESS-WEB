# ============================================
# Stage 1: Dependencies Installation Stage (Prod)
# ============================================

# This Dockerfile uses Node.js 24.13.0-slim, which was the latest LTS version at the time of writing.
ARG NODE_VERSION=24.13.0-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f

FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
RUN corepack enable pnpm
# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json pnpm-lock.yaml* .npmrc* ./
# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ============================================
# Stage 2: Development Stage
# ============================================

FROM node:${NODE_VERSION} AS development
WORKDIR /app
RUN corepack enable pnpm
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "dev"]


# ============================================
# Stage 3: Builder (reuse prod deps)
# ============================================

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Inject public Supabase config — these are baked into the client bundle at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN --mount=type=cache,target=/app/.next/cache \
  corepack enable pnpm && pnpm build

  
# ============================================
# Stage 4: Runner Next.js application
# ============================================

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]