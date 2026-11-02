# Build from the repository root:
#   docker build -f apps/guide-runtime/Dockerfile -t guide-runtime .
# Keep the Node major in sync with .nvmrc and package.json "engines".
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/guide-runtime/package.json apps/guide-runtime/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/mcp-templates/package.json packages/mcp-templates/package.json
RUN pnpm install --frozen-lockfile --prod \
    --filter @all-things-mcp/guide-runtime...

FROM base
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/guide-runtime/node_modules ./apps/guide-runtime/node_modules
COPY --from=deps /app/packages ./packages
COPY apps/guide-runtime ./apps/guide-runtime
COPY packages/contracts ./packages/contracts
COPY packages/mcp-templates ./packages/mcp-templates
RUN chown -R node:node /app
USER node
EXPOSE 8787
WORKDIR /app/apps/guide-runtime
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# The workspace packages export TypeScript sources, so tsx loads them at runtime.
CMD ["node", "--import", "tsx", "src/server.ts"]
