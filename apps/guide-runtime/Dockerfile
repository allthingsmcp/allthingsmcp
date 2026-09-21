FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/guide-runtime/package.json apps/guide-runtime/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/mcp-templates/package.json packages/mcp-templates/package.json
RUN pnpm install --frozen-lockfile --prod

FROM base
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/guide-runtime/node_modules ./apps/guide-runtime/node_modules
COPY --from=deps /app/packages ./packages
COPY apps/guide-runtime ./apps/guide-runtime
COPY packages/contracts ./packages/contracts
COPY packages/mcp-templates ./packages/mcp-templates
EXPOSE 8787
WORKDIR /app/apps/guide-runtime
CMD ["pnpm", "start"]
