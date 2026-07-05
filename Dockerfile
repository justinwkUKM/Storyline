# syntax=docker/dockerfile:1.7

# ---- deps stage ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build stage ----
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install wget for healthcheck
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
