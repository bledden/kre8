# Complete Implementation Plan: All Improvements & Fixes

**Date**: 2025-01-20  
**Total Items**: 25 improvements/fixes  
**Estimated Effort**: ~40-60 hours

---

## 🔴 CRITICAL PRIORITY (Fix Immediately)

### 1. Fix Build Error: Strudel Type Declaration Mismatch

**File**: `packages/frontend/src/types/strudel.d.ts`  
**Issue**: Type declaration doesn't match actual @strudel/web API  
**Impact**: Blocks production build

**Implementation**:

```typescript
// packages/frontend/src/types/strudel.d.ts
declare module '@strudel/web' {
  // Check actual API by inspecting node_modules/@strudel/web
  // Common patterns:
  
  // Option 1: If it exports a default REPL object
  export interface StrudelRepl {
    evaluate(code: string, autoStart?: boolean): Promise<any>;
    start(): void;
    stop(): void;
    setCps(cps: number): void;
    scheduler?: { started: boolean };
  }
  
  export function repl(options?: any): Promise<StrudelRepl>;
  export function getAudioContext(): AudioContext | null;
  
  // Option 2: If it exports initStrudel
  // export function initStrudel(): Promise<StrudelRepl>;
  
  // Option 3: If it's a default export
  // const strudel: { repl(...), ... };
  // export default strudel;
}
```

**Steps**:
1. Inspect actual API: `cd packages/frontend && cat node_modules/@strudel/web/package.json`
2. Check exports: Look at `node_modules/@strudel/web/dist/index.js` or `.d.ts`
3. Update type declaration to match actual exports
4. Update `strudelService.ts` to use correct API
5. Test build: `npm run build:frontend`

**Alternative**: If API is unclear, use `any` type temporarily:
```typescript
declare module '@strudel/web' {
  const strudel: any;
  export default strudel;
  export function repl(options?: any): Promise<any>;
}
```

---

### 2. Implement LRU Cache for API Responses

**File**: `packages/backend/src/services/cacheService.ts` (new)  
**Issue**: No caching despite documentation - every request hits API  
**Impact**: HIGH - Cost and performance

**Implementation**:

```typescript
// packages/backend/src/services/cacheService.ts
import LRU from 'lru-cache';
import { StrudelCode } from '@kre8/shared';
import crypto from 'crypto';

interface CacheEntry {
  code: StrudelCode;
  timestamp: number;
  hitCount: number;
}

// Create cache instance
const patternCache = new LRU<string, CacheEntry>({
  max: parseInt(process.env.CACHE_MAX_SIZE || '500', 10),
  maxAge: parseInt(process.env.CACHE_MAX_AGE || '3600000', 10), // 1 hour default
  updateAgeOnGet: true, // Reset TTL on access
  length: (entry, key) => {
    // Estimate size: code length + metadata
    return entry.code.code.length + 200; // ~200 bytes for metadata
  },
});

/**
 * Generate cache key from request
 * Uses hash to handle long prompts efficiently
 */
function getCacheKey(
  prompt: string,
  config?: Record<string, unknown>,
  taskType?: string
): string {
  const keyData = JSON.stringify({
    prompt: prompt.trim().toLowerCase(),
    config: config || {},
    taskType: taskType || 'generate_music',
  });
  
  // Use hash for long keys (O(n) but prevents huge keys)
  return crypto.createHash('sha256').update(keyData).digest('hex');
}

/**
 * Get cached result if available
 */
export function getCachedResult(
  prompt: string,
  config?: Record<string, unknown>,
  taskType?: string
): StrudelCode | null {
  const key = getCacheKey(prompt, config, taskType);
  const entry = patternCache.get(key);
  
  if (entry) {
    entry.hitCount++;
    console.log(`[Cache] Hit for key: ${key.substring(0, 8)}... (hits: ${entry.hitCount})`);
    return entry.code;
  }
  
  return null;
}

/**
 * Store result in cache
 */
export function setCachedResult(
  prompt: string,
  config: Record<string, unknown> | undefined,
  taskType: string | undefined,
  code: StrudelCode
): void {
  const key = getCacheKey(prompt, config, taskType);
  const entry: CacheEntry = {
    code,
    timestamp: Date.now(),
    hitCount: 0,
  };
  
  patternCache.set(key, entry);
  console.log(`[Cache] Stored key: ${key.substring(0, 8)}...`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: patternCache.size,
    maxSize: patternCache.max,
    calculatedSize: patternCache.calculatedSize,
    hits: Array.from(patternCache.values()).reduce((sum, e) => sum + e.hitCount, 0),
  };
}

/**
 * Clear cache (useful for testing or manual invalidation)
 */
export function clearCache(): void {
  patternCache.clear();
}
```

**Update `aiService.ts`**:

```typescript
// Add import
import { getCachedResult, setCachedResult } from './cacheService.js';

// In generateMusicCode(), before API call:
export async function generateMusicCode(
  request: GenerationRequest
): Promise<StrudelCode> {
  // ... existing validation ...

  // Check cache first
  const taskType: TaskType = request.refinement ? 'refine_music' : 'generate_music';
  const cached = getCachedResult(request.prompt, request.config, taskType);
  if (cached) {
    console.log('[AI Service] Returning cached result');
    return cached;
  }

  // ... existing API call code ...

  // After successful API call, cache the result
  const result: StrudelCode = {
    code,
    explanation: explanation || 'Generated Strudel pattern',
    metadata: {
      tempo: request.config?.tempo || defaults.tempo,
      instruments: extractInstruments(code),
    },
  };

  // Cache the result
  setCachedResult(request.prompt, request.config, taskType, result);

  return result;
}
```

**Add to `package.json`**:
```json
{
  "dependencies": {
    "lru-cache": "^10.0.0"
  }
}
```

**Add cache stats endpoint**:
```typescript
// packages/backend/src/routes/config.ts
import { getCacheStats } from '../services/cacheService.js';

configRoutes.get('/cache/stats', (req, res) => {
  res.json({ success: true, data: getCacheStats() });
});
```

**Environment Variables**:
```bash
CACHE_MAX_SIZE=500
CACHE_MAX_AGE=3600000  # 1 hour in ms
```

---

## 🟡 HIGH PRIORITY (Next Sprint)

### 3. Standardize Error Handling: Migrate to Result Pattern

**Files**: `packages/backend/src/services/aiService.ts`  
**Issue**: Mix of try/catch and Result<T, E> patterns  
**Impact**: Medium - Reduces type safety benefits

**Implementation**:

**Step 1**: Update `aiService.ts` to return Result type:

```typescript
import { Result, Ok, Err, AIServiceError, APIError, ValidationError } from '@kre8/shared';

export async function generateMusicCode(
  request: GenerationRequest
): Promise<Result<StrudelCode, AIServiceError>> {
  if (!XAI_API_KEY) {
    return Err({
      type: 'api_error',
      statusCode: 500,
      retryable: false,
      message: 'XAI_API_KEY not configured',
      timestamp: new Date(),
    });
  }

  try {
    // Check cache
    const taskType: TaskType = request.refinement ? 'refine_music' : 'generate_music';
    const cached = getCachedResult(request.prompt, request.config, taskType);
    if (cached) {
      return Ok(cached);
    }

    // ... existing prompt building ...

    // API call
    const response = await axios.post<GrokResponse>(...);

    // ... existing processing ...

    const result: StrudelCode = {
      code,
      explanation: explanation || 'Generated Strudel pattern',
      metadata: {
        tempo: request.config?.tempo || defaults.tempo,
        instruments: extractInstruments(code),
      },
    };

    // Cache result
    setCachedResult(request.prompt, request.config, taskType, result);

    return Ok(result);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const statusCode = axiosError.response?.status || 500;
      
      return Err({
        type: 'api_error',
        statusCode,
        retryable: statusCode >= 500 || statusCode === 429,
        retryAfter: statusCode === 429 ? 60 : undefined,
        message: axiosError.response?.data?.error?.message || axiosError.message,
        timestamp: new Date(),
        originalError: error,
      });
    }

    return Err({
      type: 'validation_error',
      field: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      originalError: error instanceof Error ? error : undefined,
    });
  }
}
```

**Step 2**: Update route handler:

```typescript
// packages/backend/src/routes/music.ts
musicRoutes.post('/generate', async (req, res, next) => {
  try {
    const validatedRequest = GenerationRequestSchema.parse(req.body);
    const result = await generateMusicCode(validatedRequest);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      // Map error types to HTTP status codes
      const statusCode = result.error.type === 'api_error' 
        ? result.error.statusCode 
        : result.error.type === 'validation_error' 
        ? 400 
        : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          type: result.error.type,
          message: result.error.message || 'An error occurred',
          ...(result.error.type === 'api_error' && {
            retryable: result.error.retryable,
            retryAfter: result.error.retryAfter,
          }),
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          type: 'validation_error',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }
    next(error);
  }
});
```

**Step 3**: Update frontend to handle Result type:

```typescript
// packages/frontend/src/services/api.ts
export const musicApi = {
  async generate(request: GenerationRequest): Promise<StrudelCode> {
    const response = await api.post<{ 
      success: boolean; 
      data?: StrudelCode;
      error?: { type: string; message: string; retryable?: boolean };
    }>('/music/generate', request);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Generation failed');
  },
};
```

---

### 4. Implement Request Deduplication

**File**: `packages/backend/src/services/requestDeduplicator.ts` (new)  
**Issue**: Duplicate simultaneous requests waste API credits  
**Impact**: Medium - Cost optimization

**Implementation**:

```typescript
// packages/backend/src/services/requestDeduplicator.ts
import crypto from 'crypto';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// Map of request key -> pending promise
const pendingRequests = new Map<string, PendingRequest<any>>();

// Cleanup old requests (older than 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > CLEANUP_INTERVAL) {
      pendingRequests.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Generate request key from parameters
 */
function getRequestKey(
  prompt: string,
  config?: Record<string, unknown>,
  taskType?: string
): string {
  const keyData = JSON.stringify({
    prompt: prompt.trim().toLowerCase(),
    config: config || {},
    taskType: taskType || 'generate_music',
  });
  return crypto.createHash('sha256').update(keyData).digest('hex');
}

/**
 * Deduplicate requests - if same request is pending, return existing promise
 */
export function deduplicateRequest<T>(
  prompt: string,
  config: Record<string, unknown> | undefined,
  taskType: string | undefined,
  requestFn: () => Promise<T>
): Promise<T> {
  const key = getRequestKey(prompt, config, taskType);
  const existing = pendingRequests.get(key);

  if (existing) {
    console.log(`[Deduplication] Reusing pending request: ${key.substring(0, 8)}...`);
    return existing.promise;
  }

  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  console.log(`[Deduplication] New request: ${key.substring(0, 8)}...`);
  return promise;
}

/**
 * Get deduplication statistics
 */
export function getDeduplicationStats() {
  return {
    pendingRequests: pendingRequests.size,
  };
}
```

**Update `aiService.ts`**:

```typescript
import { deduplicateRequest } from './requestDeduplicator.js';

export async function generateMusicCode(
  request: GenerationRequest
): Promise<Result<StrudelCode, AIServiceError>> {
  // ... validation ...

  const taskType: TaskType = request.refinement ? 'refine_music' : 'generate_music';

  // Wrap API call in deduplication
  return deduplicateRequest(
    request.prompt,
    request.config,
    taskType,
    async () => {
      // Check cache first
      const cached = getCachedResult(request.prompt, request.config, taskType);
      if (cached) {
        return Ok(cached);
      }

      // ... existing API call logic ...

      const result: StrudelCode = { ... };
      setCachedResult(request.prompt, request.config, taskType, result);
      return Ok(result);
    }
  );
}
```

---

### 5. Token-Aware Conversation History Truncation

**File**: `packages/backend/src/services/aiService.ts`  
**Issue**: Fixed 5-message window may exceed token limits or lose context  
**Impact**: Medium - Quality and reliability

**Implementation**:

```typescript
// packages/backend/src/services/tokenCounter.ts (new)
/**
 * Rough token estimation (1 token ≈ 4 characters for English)
 * More accurate: use tiktoken library if needed
 */
export function estimateTokens(text: string): number {
  // Simple estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

/**
 * Truncate conversation history to fit within token budget
 * Prioritizes most recent messages
 */
export function truncateHistory(
  messages: Message[],
  maxTokens: number = 2000, // Default budget
  systemMessageTokens: number = 500 // Reserve for system message
): Message[] {
  const availableTokens = maxTokens - systemMessageTokens;
  let totalTokens = 0;
  const truncated: Message[] = [];

  // Process messages in reverse (most recent first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = estimateTokens(message.content);

    if (totalTokens + messageTokens <= availableTokens) {
      truncated.unshift(message); // Add to beginning
      totalTokens += messageTokens;
    } else {
      // If we can't fit this message, stop
      break;
    }
  }

  return truncated;
}
```

**Update `aiService.ts`**:

```typescript
import { truncateHistory } from './tokenCounter.js';

// In generateMusicCode():
const MAX_TOKENS = 4000; // Model max
const SYSTEM_MESSAGE_TOKENS = estimateTokens(systemMessage);

// Build user message with token-aware history
let userMessage = request.prompt;
if (request.conversationHistory && request.conversationHistory.length > 0) {
  const truncatedHistory = truncateHistory(
    request.conversationHistory,
    MAX_TOKENS,
    SYSTEM_MESSAGE_TOKENS
  );
  
  const history = truncatedHistory
    .map((msg: Message) => `${msg.role}: ${msg.content}`)
    .join('\n');
  userMessage = `Previous conversation:\n${history}\n\nNew request: ${request.prompt}`;
}
```

**Optional**: Use `tiktoken` for accurate counting:
```bash
npm install tiktoken
```

```typescript
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4'); // Use appropriate model
function estimateTokens(text: string): number {
  return enc.encode(text).length;
}
```

---

### 6. Extract Magic Numbers to Named Constants

**Files**: Multiple  
**Issue**: Hardcoded values reduce maintainability  
**Impact**: Low - Code quality

**Implementation**:

```typescript
// packages/backend/src/services/constants.ts (new)
/**
 * AI Service Constants
 */
export const AI_CONSTANTS = {
  // Model limits
  MAX_TOKENS: 4000,
  DEFAULT_TEMPERATURE: 0.7,
  
  // Conversation history
  DEFAULT_HISTORY_WINDOW: 5, // messages
  MAX_HISTORY_TOKENS: 2000,
  SYSTEM_MESSAGE_TOKEN_RESERVE: 500,
  
  // API timeouts
  API_TIMEOUT_MS: 30000, // 30 seconds
  API_RETRY_DELAY_MS: 1000,
  MAX_RETRIES: 3,
  
  // Cache
  DEFAULT_CACHE_SIZE: 500,
  DEFAULT_CACHE_TTL_MS: 3600000, // 1 hour
  
  // Request deduplication
  DEDUPLICATION_CLEANUP_MS: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Code Processing Constants
 */
export const CODE_CONSTANTS = {
  // Comment stripping
  MAX_CODE_LENGTH: 10000,
  
  // Instrument extraction
  MAX_INSTRUMENTS: 50,
} as const;
```

**Update files to use constants**:

```typescript
// aiService.ts
import { AI_CONSTANTS } from './constants.js';

// Replace:
// max_tokens: 4000,
max_tokens: AI_CONSTANTS.MAX_TOKENS,

// Replace:
// timeout: 30000,
timeout: AI_CONSTANTS.API_TIMEOUT_MS,

// Replace:
// .slice(-5)
.slice(-AI_CONSTANTS.DEFAULT_HISTORY_WINDOW)
```

---

### 7. Optimize String Processing: Single-Pass Template Rendering

**File**: `packages/backend/src/services/configLoader.ts`  
**Issue**: Multiple passes over template string  
**Impact**: Low - Performance optimization

**Implementation**:

```typescript
// Current (O(n*m)):
function renderPrompt(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let rendered = template;
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const matches = Array.from(template.matchAll(placeholderRegex));
  
  for (const match of matches) {
    const placeholder = match[0];
    const key = match[1];
    const value = variables[key];
    rendered = rendered.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value ?? ''));
  }
  
  return rendered;
}

// Optimized (O(n) single pass):
function renderPrompt(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match; // Keep placeholder if not found
  });
}
```

**Complexity Improvement**: O(n) single pass vs O(n*m) where m = number of placeholders

---

## 🟢 MEDIUM PRIORITY (Future Enhancements)

### 8. Add Memoization for Expensive Operations

**Files**: `packages/backend/src/services/aiService.ts`  
**Issue**: `extractInstruments()` and `stripComments()` called repeatedly  
**Impact**: Low - Performance optimization

**Implementation**:

```typescript
// packages/backend/src/utils/memoize.ts (new)
import crypto from 'crypto';

interface MemoCache<T> {
  [key: string]: { value: T; timestamp: number };
}

const MEMO_TTL = 60 * 60 * 1000; // 1 hour
const memoCaches = new Map<string, MemoCache<any>>();

function getCacheKey(...args: any[]): string {
  return crypto.createHash('sha256')
    .update(JSON.stringify(args))
    .digest('hex');
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  cacheName: string = 'default',
  ttl: number = MEMO_TTL
): T {
  if (!memoCaches.has(cacheName)) {
    memoCaches.set(cacheName, {});
  }
  const cache = memoCaches.get(cacheName)!;

  return ((...args: any[]) => {
    const key = getCacheKey(...args);
    const cached = cache[key];

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache[key] = { value: result, timestamp: Date.now() };
    return result;
  }) as T;
}
```

**Usage**:

```typescript
import { memoize } from '../utils/memoize.js';

// Memoize expensive operations
export const extractInstruments = memoize(
  function extractInstruments(code: string): string[] {
    // ... existing implementation ...
  },
  'extractInstruments',
  3600000 // 1 hour TTL
);

export const stripComments = memoize(
  function stripComments(code: string): string {
    // ... existing implementation ...
  },
  'stripComments',
  3600000
);
```

---

### 9. Implement Streaming Support

**File**: `packages/backend/src/services/aiService.ts`  
**Issue**: No streaming despite architecture docs mentioning it  
**Impact**: Medium - UX improvement

**Implementation**:

```typescript
// Add streaming method
export async function* streamMusicCode(
  request: GenerationRequest
): AsyncGenerator<CodeFragment, GenerationResult, undefined> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY not configured');
  }

  // ... build messages ...

  // Use streaming endpoint
  const response = await axios.post(
    XAI_BASE_URL,
    {
      model: getModelForTask(taskType),
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true, // Enable streaming
    },
    {
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
      responseType: 'stream',
      timeout: 60000, // Longer timeout for streaming
    }
  );

  let accumulatedCode = '';
  let tokenIndex = 0;

  // Process stream
  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          
          if (content) {
            accumulatedCode += content;
            tokenIndex++;
            
            yield {
              content,
              isComplete: false,
              tokenIndex,
            };
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }

  // Process final code
  const code = stripComments(convertToCpm(accumulatedCode));
  
  return {
    code: toBrandedStrudelCode(code),
    explanation: 'Streamed generation complete',
    config: {},
    metadata: {
      modelUsed: getModelForTask(taskType),
      tokensUsed: tokenIndex,
      generationTimeMs: Date.now() - startTime,
      cachedResult: false,
    },
  };
}
```

**Add streaming route**:

```typescript
// packages/backend/src/routes/music.ts
musicRoutes.post('/generate/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const validatedRequest = GenerationRequestSchema.parse(req.body);
    
    for await (const fragment of streamMusicCode(validatedRequest)) {
      res.write(`data: ${JSON.stringify(fragment)}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
```

---

### 10. Add Input Validation Guards

**Files**: `packages/backend/src/services/aiService.ts`  
**Issue**: `stripComments()` and `convertToCpm()` don't validate input  
**Impact**: Low - Defensive programming

**Implementation**:

```typescript
function stripComments(code: string): string {
  // Input validation
  if (!code || typeof code !== 'string') {
    throw new Error('Code must be a non-empty string');
  }
  
  if (code.length > CODE_CONSTANTS.MAX_CODE_LENGTH) {
    throw new Error(`Code exceeds maximum length of ${CODE_CONSTANTS.MAX_CODE_LENGTH}`);
  }

  // ... existing implementation ...
}

function convertToCpm(code: string): string {
  // Input validation
  if (!code || typeof code !== 'string') {
    return '';
  }

  // ... existing implementation ...
  
  // Validate numeric conversion
  const cps = parseFloat(setcpsMatch[1]);
  if (isNaN(cps) || cps < 0 || cps > 10) {
    console.warn(`Invalid CPS value: ${cps}, skipping conversion`);
    return code.replace(/;$/gm, '').trim();
  }

  // ... rest of implementation ...
}
```

---

### 11. Add Retry Logic with Exponential Backoff

**File**: `packages/backend/src/services/aiService.ts`  
**Issue**: No retry logic for transient API failures  
**Impact**: Medium - Reliability

**Implementation**:

```typescript
// packages/backend/src/utils/retry.ts (new)
import { AI_CONSTANTS } from './constants.js';

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = AI_CONSTANTS.MAX_RETRIES,
  baseDelay: number = AI_CONSTANTS.API_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          throw error; // Don't retry client errors
        }
      }

      // Last attempt - throw error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: delay = baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}
```

**Usage**:

```typescript
import { retryWithBackoff } from '../utils/retry.js';

// Wrap API call
const response = await retryWithBackoff(() =>
  axios.post<GrokResponse>(XAI_BASE_URL, { ... }, { ... })
);
```

---

### 12. Improve Error Messages with Context

**File**: `packages/backend/src/services/aiService.ts`  
**Issue**: Generic error messages don't help debugging  
**Impact**: Low - Developer experience

**Implementation**:

```typescript
// Add context to errors
catch (error) {
  const context = {
    prompt: request.prompt.substring(0, 100), // First 100 chars
    taskType,
    model: getModelForTask(taskType),
    hasConfig: !!request.config,
    historyLength: request.conversationHistory?.length || 0,
  };

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    const statusCode = axiosError.response?.status || 500;
    
    console.error('[AI Service] API Error:', {
      ...context,
      statusCode,
      response: axiosError.response?.data,
    });

    return Err({
      type: 'api_error',
      statusCode,
      retryable: statusCode >= 500 || statusCode === 429,
      message: axiosError.response?.data?.error?.message || axiosError.message,
      timestamp: new Date(),
      originalError: error,
    });
  }

  console.error('[AI Service] Unknown Error:', {
    ...context,
    error: error instanceof Error ? error.message : String(error),
  });

  // ... rest of error handling ...
}
```

---

### 13. Add Request Logging/Monitoring

**File**: `packages/backend/src/middleware/requestLogger.ts` (new)  
**Issue**: No structured logging for requests  
**Impact**: Low - Observability

**Implementation**:

```typescript
// packages/backend/src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  method: string;
  path: string;
  timestamp: number;
  duration: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
}

const requestLogs: RequestLog[] = [];
const MAX_LOGS = 1000; // Keep last 1000 requests

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const log: RequestLog = {
    method: req.method,
    path: req.path,
    timestamp: startTime,
    duration: 0,
    statusCode: 0,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  };

  res.on('finish', () => {
    log.duration = Date.now() - startTime;
    log.statusCode = res.statusCode;

    // Add to logs (FIFO)
    requestLogs.push(log);
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.shift();
    }

    // Log slow requests
    if (log.duration > 1000) {
      console.warn(`[Slow Request] ${log.method} ${log.path} took ${log.duration}ms`);
    }
  });

  next();
}

export function getRequestStats() {
  const recent = requestLogs.slice(-100); // Last 100 requests
  const avgDuration = recent.reduce((sum, log) => sum + log.duration, 0) / recent.length;
  const errorRate = recent.filter(log => log.statusCode >= 400).length / recent.length;

  return {
    totalRequests: requestLogs.length,
    averageDuration: avgDuration,
    errorRate: errorRate * 100,
    recentRequests: recent.slice(-10),
  };
}
```

**Add to server**:

```typescript
// packages/backend/src/server.ts
import { requestLogger } from './middleware/requestLogger.js';

app.use(requestLogger);
```

---

### 14. Add Health Check Endpoints

**File**: `packages/backend/src/routes/health.ts` (new)  
**Issue**: Basic health check, could be more comprehensive  
**Impact**: Low - Monitoring

**Implementation**:

```typescript
// packages/backend/src/routes/health.ts
import { Router } from 'express';
import { getCacheStats } from '../services/cacheService.js';
import { getDeduplicationStats } from '../services/requestDeduplicator.js';
import { getRequestStats } from '../middleware/requestLogger.js';

export const healthRoutes = Router();

healthRoutes.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

healthRoutes.get('/detailed', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: getCacheStats(),
    deduplication: getDeduplicationStats(),
    requests: getRequestStats(),
    environment: process.env.NODE_ENV,
  });
});
```

---

### 15. Add Code Validation Before Execution

**File**: `packages/backend/src/services/codeValidator.ts` (new)  
**Issue**: No validation that generated code is valid Strudel  
**Impact**: Medium - Quality

**Implementation**:

```typescript
// packages/backend/src/services/codeValidator.ts
import { Result, Ok, Err, ValidationError } from '@kre8/shared';

/**
 * Validate Strudel code syntax (basic checks)
 */
export function validateStrudelCode(code: string): Result<string, ValidationError> {
  if (!code || code.trim().length === 0) {
    return Err({
      type: 'validation_error',
      field: 'code',
      message: 'Code cannot be empty',
      timestamp: new Date(),
    });
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /require\s*\(/,
    /import\s+/,
    /fetch\s*\(/,
    /XMLHttpRequest/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return Err({
        type: 'validation_error',
        field: 'code',
        message: `Code contains dangerous pattern: ${pattern}`,
        timestamp: new Date(),
        invalidValue: code,
      });
    }
  }

  // Check for basic Strudel syntax
  const hasStrudelPattern = /(s|n|stack|cat|slow|fast|rev|sometimes)\(/.test(code);
  if (!hasStrudelPattern) {
    return Err({
      type: 'validation_error',
      field: 'code',
      message: 'Code does not appear to contain valid Strudel patterns',
      timestamp: new Date(),
      invalidValue: code,
    });
  }

  return Ok(code);
}
```

**Use in aiService.ts**:

```typescript
import { validateStrudelCode } from './codeValidator.js';

// After processing code:
const validationResult = validateStrudelCode(code);
if (!validationResult.success) {
  console.warn('[AI Service] Generated code failed validation:', validationResult.error);
  // Could retry with different prompt or return error
}
```

---

## 🔵 LOW PRIORITY (Nice to Have)

### 16. Migrate Express to Fastify

**Files**: All backend files  
**Issue**: Express slower than Fastify (2x)  
**Impact**: Low - Performance optimization

**Implementation**: Large refactor, see Fastify migration guide

---

### 17. Add Web Workers for Audio Processing

**File**: `packages/frontend/src/workers/audioWorker.ts` (new)  
**Issue**: Audio processing blocks main thread  
**Impact**: Low - UX improvement

---

### 18. Implement Ring Buffer for Audio Recording

**File**: `packages/frontend/src/services/audioRecorder.ts`  
**Issue**: Architecture docs mention it but not implemented  
**Impact**: Low - Performance optimization

---

### 19. Add API Key Rotation Strategy

**File**: `packages/backend/src/services/keyRotation.ts` (new)  
**Issue**: Static API keys  
**Impact**: Low - Security hardening

---

### 20. Add Request Signing

**File**: `packages/backend/src/middleware/requestSigning.ts` (new)  
**Issue**: No request signing  
**Impact**: Low - Security hardening

---

### 21. Expand Test Coverage

**Files**: All test files  
**Issue**: ~40% coverage, target 70%+  
**Impact**: Medium - Quality assurance

---

### 22. Add Integration Tests for Streaming

**File**: `tests/integration/streaming.test.ts` (new)  
**Issue**: No tests for streaming feature  
**Impact**: Low - Test coverage

---

### 23. Add Performance Benchmarks

**File**: `tests/performance/benchmarks.test.ts` (new)  
**Issue**: No performance benchmarks  
**Impact**: Low - Monitoring

---

### 24. Add Prometheus Metrics

**File**: `packages/backend/src/middleware/metrics.ts` (new)  
**Issue**: No metrics collection  
**Impact**: Low - Observability

---

### 25. Add Rate Limiting Per User/IP

**File**: `packages/backend/src/middleware/rateLimiter.ts`  
**Issue**: Global rate limit, not per user  
**Impact**: Low - Fairness

---

## Summary

**Total Improvements**: 25  
**Critical**: 2  
**High Priority**: 5  
**Medium Priority**: 8  
**Low Priority**: 10

**Estimated Total Effort**: 40-60 hours

**Recommended Order**:
1. Fix build error (1 hour)
2. Implement caching (4 hours)
3. Standardize error handling (6 hours)
4. Request deduplication (3 hours)
5. Token-aware history (4 hours)
6. Extract constants (2 hours)
7. Optimize string processing (1 hour)
8. Add retry logic (3 hours)
9. Add validation (2 hours)
10. Streaming support (8 hours)

**Quick Wins** (can do immediately):
- Fix build error
- Extract magic numbers
- Optimize template rendering
- Add input validation

**High Impact** (do next):
- Implement caching
- Standardize error handling
- Request deduplication
