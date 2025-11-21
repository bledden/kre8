# Project Setup Guide

## Quick Start

```bash
# 1. Initialize monorepo with pnpm
pnpm init

# 2. Install dependencies
pnpm add -D typescript @types/node tsx

# 3. Create workspace structure
mkdir -p apps/{web,api} packages/types docs

# 4. Initialize workspaces
```

## Workspace Configuration

**pnpm-workspace.yaml**:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root package.json**:
```json
{
  "name": "kre8",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev & pnpm --filter api dev",
    "build": "pnpm --filter types build && pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "tsx": "^4.7.0",
    "prettier": "^3.1.1",
    "eslint": "^8.56.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

---

## Frontend Setup (apps/web)

```bash
cd apps/web
pnpm create vite@latest . --template react-ts
```

**package.json**:
```json
{
  "name": "@kre8/web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@kre8/types": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@strudel/core": "^1.0.0",
    "@strudel/webaudio": "^1.0.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.23.0",
    "lru-cache": "^10.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

**tsconfig.json** (apps/web):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@kre8/types": ["../../packages/types/src"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Backend Setup (apps/api)

```bash
cd apps/api
pnpm init
```

**package.json**:
```json
{
  "name": "@kre8/api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint . --ext ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@kre8/types": "workspace:*",
    "fastify": "^4.25.2",
    "@fastify/cors": "^8.5.0",
    "@fastify/compress": "^6.5.0",
    "@fastify/rate-limit": "^9.1.0",
    "lru-cache": "^10.1.0",
    "pino": "^8.17.2",
    "pino-pretty": "^10.3.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.1.1"
  }
}
```

**tsconfig.json** (apps/api):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",

    /* Type checking */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    /* Interop */
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@kre8/types": ["../../packages/types/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Shared Types Package (packages/types)

**package.json**:
```json
{
  "name": "@kre8/types",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**tsconfig.json** (packages/types):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    /* Type checking */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    /* Interop */
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**src/index.ts** (packages/types):
```typescript
export * from './ai-service.types';
export * from './api.types';
```

**src/api.types.ts** (packages/types):
```typescript
import { MusicConfig, StrudelCode, GenerationResult, TranscriptionResult } from './ai-service.types';

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * POST /api/generate - Generate music code from prompt
 */
export interface GenerateRequest {
  readonly prompt: string;
  readonly config?: Partial<MusicConfig>;
}

export interface GenerateResponse {
  readonly result: GenerationResult;
}

/**
 * POST /api/refine - Refine existing code
 */
export interface RefineRequest {
  readonly currentCode: StrudelCode;
  readonly refinementPrompt: string;
}

export interface RefineResponse {
  readonly result: GenerationResult;
}

/**
 * POST /api/transcribe - Transcribe audio to text
 */
export interface TranscribeRequest {
  // Multipart form data with 'audio' field
}

export interface TranscribeResponse {
  readonly result: TranscriptionResult;
}

/**
 * GET /health - Health check
 */
export interface HealthResponse {
  readonly status: 'ok' | 'degraded' | 'down';
  readonly timestamp: string;
  readonly uptime: number;
  readonly services: {
    readonly openrouter: 'ok' | 'down';
    readonly whisper: 'ok' | 'down';
  };
}

/**
 * Error response (4xx, 5xx)
 */
export interface ErrorResponse {
  readonly error: {
    readonly type: string;
    readonly message: string;
    readonly statusCode: number;
    readonly timestamp: string;
  };
}
```

---

## Environment Variables

**.env.example**:
```bash
# API Keys
OPENROUTER_API_KEY=sk-or-v1-...
WHISPER_API_KEY=sk-...

# Server config
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Model config
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_FALLBACK_MODEL=openai/gpt-4-turbo

# Rate limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=60000

# Cache config
CACHE_MAX_SIZE=500
CACHE_TTL_MS=3600000
```

---

## Git Configuration

**.gitignore**:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Temp
tmp/
temp/
```

---

## Docker Configuration

**docker-compose.yml** (root):
```yaml
version: '3.9'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - WHISPER_API_KEY=${WHISPER_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '5173:80'
    depends_on:
      - api
    restart: unless-stopped
```

**apps/api/Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @kre8/types build
RUN pnpm --filter @kre8/api build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**apps/web/Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/web ./apps/web

RUN pnpm --filter @kre8/types build
RUN pnpm --filter @kre8/web build

# Production stage with nginx
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**apps/web/nginx.conf**:
```nginx
events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}
```

---

## Development Workflow

```bash
# 1. Install all dependencies
pnpm install

# 2. Build shared types
pnpm --filter @kre8/types build

# 3. Start development servers (both frontend and backend)
pnpm dev

# 4. Run tests
pnpm test

# 5. Lint and type-check
pnpm lint
pnpm type-check

# 6. Build for production
pnpm build

# 7. Start production server
cd apps/api && pnpm start
```

---

## VSCode Configuration

**.vscode/settings.json**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

**.vscode/extensions.json**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

---

## Next Steps

1. **Phase 1**: Set up project structure
   ```bash
   # Run setup script
   ./scripts/setup.sh
   ```

2. **Phase 2**: Implement core features
   - Frontend: StrudelPlayer component
   - Backend: OpenRouter integration
   - Types: Add missing types as needed

3. **Phase 3**: Deploy to Railway
   ```bash
   railway up
   ```

**You're ready to start building!** 🚀

Refer to [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for implementation details.
