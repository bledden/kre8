# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci

# Build shared package
FROM base AS build-shared
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY tsconfig.json ./
RUN cd packages/shared && npm run build

# Build backend
FROM base AS build-backend
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-shared /app/packages/shared/dist ./packages/shared/dist
COPY packages/backend ./packages/backend
COPY tsconfig.json ./
RUN cd packages/backend && npm run build

# Build frontend
FROM base AS build-frontend
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-shared /app/packages/shared/dist ./packages/shared/dist
COPY packages/frontend ./packages/frontend
COPY tsconfig.json ./
RUN cd packages/frontend && npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=build-backend /app/packages/backend/dist ./packages/backend/dist
COPY --from=build-backend /app/packages/backend/package.json ./packages/backend/
COPY --from=build-shared /app/packages/shared/dist ./packages/shared/dist
COPY --from=build-shared /app/packages/shared/package.json ./packages/shared/
COPY --from=build-frontend /app/packages/frontend/dist ./packages/frontend/dist

# Copy config files
COPY config ./config

# Install production dependencies
RUN npm ci --only=production --workspace=packages/backend

EXPOSE 3001

CMD ["node", "packages/backend/dist/server.js"]

