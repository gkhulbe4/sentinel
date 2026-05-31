# Multi-stage Node build for the API. Build from the REPO ROOT:
#   docker build -f apps/api/Dockerfile -t sentinel-api .
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# Generate the Prisma client, bundle the API (tsup inlines @sentinel/*),
# then produce a self-contained deployment with prod-only dependencies.
RUN pnpm --filter @sentinel/db generate
RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod --legacy /deploy

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/dist ./dist
COPY --from=build /repo/packages/db/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/index.js"]
