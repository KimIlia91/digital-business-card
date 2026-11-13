# syntax=docker/dockerfile:1

# Pinned by digest for reproducible builds; Dependabot keeps it up to date.
ARG NODE_IMAGE=node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

FROM ${NODE_IMAGE} AS base
WORKDIR /app
# OpenSSL lets Prisma detect the platform and run its schema engine.
RUN apk add --no-cache openssl
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

FROM base AS build
# Git hooks are a developer tool; there is no repository in the image.
ENV HUSKY=0
# Manifests and the Prisma schema first, so the dependency layer stays cached.
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build \
 && npm prune --omit=dev \
 && npm cache clean --force

FROM base AS runtime
LABEL org.opencontainers.image.title="digital-business-card" \
      org.opencontainers.image.description="Digital business card: GraphQL API with Apollo Sandbox"
ENV NODE_ENV=production \
    PORT=3000

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json prisma7.config.ts ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node scripts/entrypoint.sh ./scripts/entrypoint.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health/ready" > /dev/null || exit 1

ENTRYPOINT ["sh", "./scripts/entrypoint.sh"]
