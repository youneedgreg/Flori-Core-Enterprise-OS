FROM node:20-alpine AS base

# Install necessary tools
RUN apk update && apk add --no-cache libc6-compat

# Install pnpm and turbo
RUN npm install -g pnpm turbo

# First stage: prune the workspace to only what's needed for the web app
FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune --scope=@flori/web --docker

# Second stage: install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# Third stage: build the application
FROM base AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .
COPY turbo.json tsconfig.base.json ./

# Ensure standalone output is enabled in Next.js config via environment if missing,
# but we'll also update the next.config.ts directly.
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm turbo run build --filter=@flori/web...

# Final stage: production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Next.js standalone output automatically copies necessary node_modules.
COPY --from=sourcer /app/apps/web/public ./public
# Automatically leverage output traces to reduce image size
COPY --from=sourcer /app/apps/web/.next/standalone ./
COPY --from=sourcer /app/apps/web/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
