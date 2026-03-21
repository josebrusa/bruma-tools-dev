FROM node:20-alpine AS build
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bruma/web run build

FROM nginx:1.27-alpine
COPY apps/web/nginx.default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
