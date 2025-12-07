# Voice-Activated Live Coding Music Web App - Architecture

## Tech Stack (Optimized)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **State Management**: Zustand (lightweight, modern)
- **Styling**: Tailwind CSS (utility-first, fast)
- **Code Editor**: CodeMirror 6 (modern, extensible)
- **Audio Engine**: @strudel/web (TidalCycles for browser)
- **Audio Recording**: MediaRecorder API (Web Audio)

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js (lightweight, fast)
- **Validation**: Zod (TypeScript-first schema validation)
- **HTTP Client**: Axios (with retry logic)
- **File Processing**: Multer (file uploads)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Deployment**: Railway (with Dockerfile)
- **Environment**: dotenv for config

## Project Structure

```
kre8/
├── packages/
│   ├── shared/              # Shared TypeScript types
│   │   └── src/
│   │       ├── types.ts     # Core interfaces
│   │       └── schemas.ts   # Zod validation schemas
│   ├── frontend/            # React app
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # React hooks
│   │   │   ├── stores/      # Zustand stores
│   │   │   ├── services/    # API clients
│   │   │   └── utils/       # Utilities
│   │   └── vite.config.ts
│   └── backend/             # Express API
│       ├── src/
│       │   ├── routes/       # API routes
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Express middleware
│       │   └── utils/       # Utilities
│       └── server.ts
├── config/                  # Configuration files
│   ├── prompts/
│   │   ├── music_generation.txt
│   │   ├── refinement.txt
│   │   └── few_shot_examples.json
│   ├── defaults.json
│   └── models.json
├── docker-compose.yml
├── Dockerfile
├── package.json            # Root workspace config
└── README.md
```

## Data Structures

### Core Types
```typescript
interface StrudelCode {
  code: string;
  explanation?: string;
  metadata?: {
    tempo?: number;
    instruments?: string[];
  };
}

interface MusicConfig {
  tempo?: number;
  scale?: string;
  key?: string;
  samples?: Record<string, string>;
}

interface GenerationRequest {
  prompt: string;
  config?: MusicConfig;
  conversationHistory?: Message[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### API Response Types
```typescript
interface AIServiceResponse {
  code: string;
  explanation?: string;
  model?: string;
  tokensUsed?: number;
}

interface TranscriptionResponse {
  text: string;
  language?: string;
  confidence?: number;
}
```

## Algorithms & Best Practices

### 1. Prompt Template System
- **Template Engine**: Simple string substitution with variable placeholders
- **Format**: `{{variable}}` syntax for easy parsing
- **Validation**: Zod schema for template structure
- **Caching**: In-memory cache for loaded templates

### 2. Code Validation & Sanitization
- **Pre-execution**: Validate Strudel syntax before execution
- **Sandboxing**: Execute in isolated context (browser only)
- **Error Handling**: Catch and display execution errors gracefully
- **Fallback**: Return safe default pattern on validation failure

### 3. API Request Management
- **Retry Logic**: Exponential backoff for failed requests
- **Rate Limiting**: Client-side rate limiting to prevent abuse
- **Queue System**: Request queue for sequential processing
- **Timeout Handling**: Configurable timeouts per endpoint

### 4. Audio Processing
- **Buffering**: Proper audio buffer management for smooth playback
- **Recording**: MediaRecorder with configurable quality
- **Format**: WAV for download (uncompressed, high quality)
- **Streaming**: Support for streaming audio if needed

### 5. State Management
- **Zustand Stores**: Separate stores for:
  - Audio playback state
  - Code generation state
  - UI state
  - Configuration state
- **Persistence**: LocalStorage for user preferences

## Configuration System

### Environment Variables
```bash
# AI Services
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
WHISPER_API_KEY=
WHISPER_PROVIDER=openai  # or 'local'

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173

# Optional
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60000
```

### Config Files
- **prompts/music_generation.txt**: Main prompt template
- **prompts/few_shot_examples.json**: Example prompt→code pairs
- **config/defaults.json**: Default music parameters
- **config/models.json**: Available models and their parameters

## Security Considerations

1. **Input Validation**: All user inputs validated with Zod schemas
2. **Code Execution**: Only in browser sandbox (no server-side execution)
3. **API Keys**: Never exposed to frontend, server-side only
4. **Rate Limiting**: Prevent API abuse
5. **CORS**: Properly configured for production
6. **Error Messages**: Sanitized to prevent information leakage

## Performance Optimizations

1. **Code Splitting**: Lazy load Strudel library
2. **Memoization**: Cache prompt templates and API responses
3. **Debouncing**: Debounce user inputs for API calls
4. **Web Workers**: Consider for heavy audio processing
5. **CDN**: Serve static assets via CDN in production

## Deployment Strategy

1. **Development**: Docker Compose for local dev
2. **Production**: Railway with Dockerfile
3. **Environment**: Separate .env files for dev/prod
4. **Monitoring**: Logging and error tracking (future)

