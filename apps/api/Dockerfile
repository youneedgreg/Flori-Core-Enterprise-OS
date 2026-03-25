FROM node:20-alpine AS base

# Install necessary tools
RUN apk update && apk add --no-cache libc6-compat

# Install pnpm and turbo
RUN npm install -g pnpm turbo

# First stage: prune the workspace to only what's needed for the API
FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune --scope=@flori/api --docker

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

RUN pnpm turbo run build --filter=@flori/api...

# Final stage: production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the built output from api
COPY --from=sourcer /app/apps/api/dist ./dist
COPY --from=sourcer /app/node_modules ./node_modules
COPY --from=sourcer /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=sourcer /app/apps/api/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/main"]
