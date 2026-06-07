FROM node:22-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY . .

RUN corepack prepare pnpm@11.5.2 --activate
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/api-server build

EXPOSE 3000

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
