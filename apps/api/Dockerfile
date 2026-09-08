FROM node:20-alpine AS base

# Install necessary tools
RUN apk update && apk add --no-cache libc6-compat

# Install pnpm and turbo
# Pin both tools. An unpinned `pnpm` installs the latest major, which reads the
# `packageManager` field, tries to self-install pnpm@10.7.0, and fails with
# ERR_PNPM_PNPM_ENGINE_IDENTITY_UNVERIFIABLE because the lockfile (v9.0) has no
# @pnpm/exe integrity entry. Matching the version outright avoids the self-install.
RUN npm install -g pnpm@10.7.0 turbo@2.10.12

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

# Copy everything from sourcer stage to ensure all dependencies and built files are present
COPY --from=sourcer /app/ .

EXPOSE 3001
# Start the application using node from the api directory
CMD ["node", "apps/api/dist/src/main"]
