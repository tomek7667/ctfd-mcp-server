FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN pnpm ci

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm ci --omit=dev

COPY --from=builder /app/build ./build

USER node

ENTRYPOINT ["node", "build/index.js"]
