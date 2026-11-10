FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Build the Next.js app
RUN CI=true pnpm i --frozen-lockfile \
    && pnpm build

# Prisma CLI, used to apply migrations when the container starts. Installed on
# its own with npm so the result is a flat, self-contained node_modules that can
# be copied into the runtime image without pnpm's symlinked store. The version
# is read from package.json so it cannot drift from the client the app is built
# against, and the engine binaries it downloads match the stage's platform.
FROM node:24-alpine AS migrator
WORKDIR /migrate-tools
COPY package.json /tmp/package.json
RUN npm install --no-save --omit=dev \
    "prisma@$(node -p "require('/tmp/package.json').devDependencies.prisma")"

# Production image
FROM node:24-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Schema and migration history, plus the CLI that applies them. Kept out of
# ./node_modules so the standalone output's own dependencies stay untouched.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=migrator --chown=nextjs:nodejs /migrate-tools/node_modules ./migrate-tools/node_modules
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

# Expose the port
EXPOSE 3000

# Migrate, then start the app
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "./server.js"]
