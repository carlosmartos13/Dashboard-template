# Stage 1: Base - Installs dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Install pnpm and dependencies
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY src/assets ./src/assets
# Use 'pnpm install --frozen-lockfile' for reproducible builds
RUN pnpm install --frozen-lockfile

# Stage 2: Development - For hot-reloading
FROM base AS dev
ENV NODE_ENV=development
# Copying the rest of the code is not strictly necessary if using volumes,
# but it's good practice for consistency.
COPY . .
# 'npm run dev' will be started by docker-compose
CMD ["npm", "run", "dev"]

# Stage 3: Builder - Creates the production build
    FROM base AS builder
    ENV NODE_ENV=production
    ENV PRISMA_CLIENT_ENGINE_TYPE=binary
    COPY . .
# Generate icons
RUN npm run build:icons
# Explicitly generate Prisma client using pnpm
    RUN pnpm prisma generate
    # Debugging: List contents of generated Prisma client after generation
    RUN ls -l /app/src/generated/prisma/


# Build the application
RUN npm run build

# Stage 4: Production - A lean, production-ready image
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production artifacts from the builder stage
# The 'standalone' output is optimized for running in a container
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# The server.js file from the standalone output is the entrypoint
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
