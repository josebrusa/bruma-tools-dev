FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bruma/api run build && pnpm --filter @bruma/worker run build
WORKDIR /repo/apps/worker
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
