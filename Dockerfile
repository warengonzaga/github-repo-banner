FROM oven/bun:1.3.9 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json tsup.config.ts LICENSE CODE_OF_CONDUCT.md README.md CONTRIBUTING.md ./
COPY docs ./docs
COPY src ./src
RUN bun run build

FROM oven/bun:1.3.9 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:22-trixie-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e 'fetch(`http://127.0.0.1:${process.env.PORT || 3000}/health`, { signal: AbortSignal.timeout(4000) }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'
CMD ["node", "dist/index.js"]
