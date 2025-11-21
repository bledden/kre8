# Kre8 Testing Plan

**Version**: 1.0  
**Last Updated**: 2025-11-20  
**Status**: Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure Setup](#test-infrastructure-setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Performance Tests](#performance-tests)
7. [Prompt Quality Tests](#prompt-quality-tests)
8. [Test Execution](#test-execution)
9. [CI/CD Integration](#cicd-integration)

---

## Overview

### Testing Strategy

This plan covers comprehensive testing across all layers:

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and service interactions
- **E2E Tests**: Full user workflows
- **Performance Tests**: Load, latency, and resource usage
- **Prompt Quality Tests**: AI generation quality and accuracy

### Testing Goals

1. ✅ **Reliability**: Ensure system works correctly under all conditions
2. ✅ **Performance**: Meet latency and throughput targets
3. ✅ **Quality**: Generate high-quality Strudel code from prompts
4. ✅ **Compatibility**: Works across browsers and environments
5. ✅ **Maintainability**: Tests serve as documentation

---

## Test Infrastructure Setup

### Required Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0",
    "supertest": "^6.3.0",
    "nock": "^13.4.0",
    "msw": "^2.0.0"
  }
}
```

### Test Structure

```
kre8/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   └── __tests__/          # Backend unit tests
│   │       ├── services/
│   │       ├── routes/
│   │       └── middleware/
│   ├── frontend/
│   │   ├── src/
│   │   └── __tests__/          # Frontend unit tests
│   │       ├── components/
│   │       ├── services/
│   │       └── stores/
│   └── shared/
│       └── __tests__/          # Shared utilities tests
├── tests/
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests
│   ├── performance/            # Performance tests
│   └── prompts/                # Prompt quality tests
└── vitest.config.ts            # Vitest configuration
```

---

## Unit Tests

### Backend Unit Tests

#### 1. Service Tests

**File**: `packages/backend/src/__tests__/services/aiService.test.ts`

```typescript
describe('AI Service', () => {
  describe('generateMusicCode', () => {
    it('should generate code from valid prompt', async () => {
      // Test with mock OpenRouter response
    });
    
    it('should handle API errors gracefully', async () => {
      // Test error handling
    });
    
    it('should extract code from markdown blocks', async () => {
      // Test code extraction logic
    });
    
    it('should include conversation history', async () => {
      // Test context building
    });
  });
  
  describe('extractInstruments', () => {
    it('should extract instruments from Strudel code', () => {
      // Test instrument extraction
    });
  });
});
```

**File**: `packages/backend/src/__tests__/services/configLoader.test.ts`

```typescript
describe('Config Loader', () => {
  it('should load prompt templates', () => {
    // Test template loading
  });
  
  it('should load few-shot examples', () => {
    // Test examples loading
  });
  
  it('should render prompts with variables', () => {
    // Test template rendering
  });
  
  it('should handle missing files gracefully', () => {
    // Test error handling
  });
});
```

**File**: `packages/backend/src/__tests__/services/whisperService.test.ts`

```typescript
describe('Whisper Service', () => {
  it('should transcribe audio files', async () => {
    // Test transcription
  });
  
  it('should handle API errors', async () => {
    // Test error handling
  });
  
  it('should support different languages', async () => {
    // Test language options
  });
});
```

#### 2. Route Tests

**File**: `packages/backend/src/__tests__/routes/music.test.ts`

```typescript
import request from 'supertest';
import app from '../../server';

describe('POST /api/music/generate', () => {
  it('should generate code with valid request', async () => {
    const response = await request(app)
      .post('/api/music/generate')
      .send({ prompt: 'create a house beat' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.code).toBeDefined();
  });
  
  it('should validate request schema', async () => {
    const response = await request(app)
      .post('/api/music/generate')
      .send({}) // Invalid: missing prompt
      .expect(400);
  });
  
  it('should use mock service when USE_MOCK_AI=true', async () => {
    process.env.USE_MOCK_AI = 'true';
    // Test mock mode
  });
});
```

**File**: `packages/backend/src/__tests__/routes/transcription.test.ts`

```typescript
describe('POST /api/transcription/transcribe', () => {
  it('should transcribe audio file', async () => {
    // Test file upload and transcription
  });
  
  it('should reject non-audio files', async () => {
    // Test file validation
  });
  
  it('should enforce file size limits', async () => {
    // Test size limits
  });
});
```

#### 3. Middleware Tests

**File**: `packages/backend/src/__tests__/middleware/rateLimiter.test.ts`

```typescript
describe('Rate Limiter', () => {
  it('should allow requests within limit', async () => {
    // Test normal operation
  });
  
  it('should block requests exceeding limit', async () => {
    // Test rate limiting
  });
  
  it('should reset after window', async () => {
    // Test window reset
  });
});
```

### Frontend Unit Tests

#### 1. Component Tests

**File**: `packages/frontend/src/__tests__/components/InputPanel.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import InputPanel from '../InputPanel';

describe('InputPanel', () => {
  it('should render input field', () => {
    render(<InputPanel />);
    expect(screen.getByPlaceholderText(/describe the music/i)).toBeInTheDocument();
  });
  
  it('should handle text input', () => {
    // Test input handling
  });
  
  it('should handle voice recording', async () => {
    // Test microphone functionality
  });
  
  it('should handle file upload', () => {
    // Test file upload
  });
});
```

**File**: `packages/frontend/src/__tests__/components/CodePanel.test.tsx`

```typescript
describe('CodePanel', () => {
  it('should display generated code', () => {
    // Test code display
  });
  
  it('should allow code editing', () => {
    // Test editing functionality
  });
  
  it('should show metadata', () => {
    // Test metadata display
  });
});
```

#### 2. Service Tests

**File**: `packages/frontend/src/__tests__/services/api.test.ts`

```typescript
import { vi } from 'vitest';
import { musicApi } from '../api';

describe('API Client', () => {
  it('should call generate endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { code: 'test' } }),
    });
    
    const result = await musicApi.generate({ prompt: 'test' });
    expect(result.code).toBe('test');
  });
  
  it('should handle API errors', async () => {
    // Test error handling
  });
});
```

**File**: `packages/frontend/src/__tests__/services/strudelService.test.ts`

```typescript
describe('Strudel Service', () => {
  it('should initialize Strudel', async () => {
    // Test initialization
  });
  
  it('should execute code', async () => {
    // Test code execution
  });
  
  it('should stop playback', async () => {
    // Test stop functionality
  });
  
  it('should handle errors gracefully', async () => {
    // Test error handling
  });
});
```

#### 3. Store Tests

**File**: `packages/frontend/src/__tests__/stores/appStore.test.ts`

```typescript
import { useAppStore } from '../stores/appStore';

describe('App Store', () => {
  it('should set current code', () => {
    const { setCurrentCode } = useAppStore.getState();
    setCurrentCode({ code: 'test', explanation: 'test' });
    expect(useAppStore.getState().currentCode?.code).toBe('test');
  });
  
  it('should manage playback state', () => {
    // Test playback state management
  });
  
  it('should manage recording state', () => {
    // Test recording state management
  });
});
```

### Shared Package Tests

**File**: `packages/shared/src/__tests__/adapters.test.ts`

```typescript
import { legacyToBrandedCode, brandedToLegacyCode } from '../adapters';

describe('Type Adapters', () => {
  it('should convert legacy to branded code', () => {
    const legacy = { code: 's("bd")', explanation: 'test' };
    const branded = legacyToBrandedCode(legacy);
    expect(branded).toBe('s("bd")');
  });
  
  it('should convert branded to legacy code', () => {
    // Test reverse conversion
  });
});
```

---

## Integration Tests

### API Integration Tests

**File**: `tests/integration/api.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../packages/backend/src/server';

describe('API Integration', () => {
  describe('Music Generation Flow', () => {
    it('should generate code end-to-end', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'create a simple drum beat',
          config: { tempo: 120 }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toContain('s(');
    });
    
    it('should handle refinement requests', async () => {
      // Test refinement flow
    });
  });
  
  describe('Transcription Flow', () => {
    it('should transcribe audio end-to-end', async () => {
      // Test transcription flow with mock audio
    });
  });
  
  describe('Configuration Endpoints', () => {
    it('should return defaults', async () => {
      const response = await request(app)
        .get('/api/config/defaults');
      
      expect(response.status).toBe(200);
      expect(response.body.data.tempo).toBeDefined();
    });
    
    it('should return available models', async () => {
      // Test models endpoint
    });
    
    it('should return few-shot examples', async () => {
      // Test examples endpoint
    });
  });
});
```

### Service Integration Tests

**File**: `tests/integration/services.test.ts`

```typescript
describe('Service Integration', () => {
  it('should load and render prompts correctly', async () => {
    // Test configLoader + aiService integration
  });
  
  it('should handle prompt template variables', async () => {
    // Test variable substitution
  });
  
  it('should include few-shot examples in prompts', async () => {
    // Test example inclusion
  });
});
```

---

## End-to-End Tests

### Setup with Playwright

**File**: `tests/e2e/playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Scenarios

**File**: `tests/e2e/music-generation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Music Generation', () => {
  test('should generate code from text prompt', async ({ page }) => {
    await page.goto('/');
    
    // Enter prompt
    await page.fill('textarea[placeholder*="describe"]', 'create a house beat');
    await page.click('button:has-text("Generate")');
    
    // Wait for code generation
    await page.waitForSelector('[data-testid="code-panel"]', { timeout: 10000 });
    
    // Verify code is displayed
    const code = await page.textContent('[data-testid="code-content"]');
    expect(code).toContain('s(');
  });
  
  test('should play generated music', async ({ page }) => {
    await page.goto('/');
    
    // Generate code first
    await page.fill('textarea[placeholder*="describe"]', 'create a simple beat');
    await page.click('button:has-text("Generate")');
    await page.waitForSelector('[data-testid="code-panel"]');
    
    // Click play
    await page.click('button:has-text("Play")');
    
    // Verify playback started
    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
  });
  
  test('should handle voice input', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);
    
    await page.goto('/');
    
    // Click voice button
    await page.click('button:has-text("Voice")');
    
    // Simulate recording (mock)
    // ... test voice flow
  });
  
  test('should download audio', async ({ page }) => {
    // Generate and play music
    // ... setup
    
    // Click record
    await page.click('button:has-text("Record")');
    
    // Wait for recording
    await page.waitForTimeout(2000);
    
    // Stop recording
    await page.click('button:has-text("Record")');
    
    // Download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });
});
```

**File**: `tests/e2e/refinement.spec.ts`

```typescript
test.describe('Code Refinement', () => {
  test('should refine existing code', async ({ page }) => {
    // Generate initial code
    // ... setup
    
    // Request refinement
    await page.fill('textarea[placeholder*="describe"]', 'add hi-hats');
    await page.click('button:has-text("Generate")');
    
    // Verify refinement applied
    const code = await page.textContent('[data-testid="code-content"]');
    expect(code).toContain('hh');
  });
});
```

---

## Performance Tests

### Load Tests

**File**: `tests/performance/load.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../packages/backend/src/server';

describe('Performance Tests', () => {
  describe('API Response Times', () => {
    it('should respond within 5 seconds', async () => {
      const start = Date.now();
      await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'test' });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000);
    });
    
    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/music/generate')
          .send({ prompt: 'test' })
      );
      
      const results = await Promise.all(requests);
      expect(results.every(r => r.status === 200 || r.status === 429)).toBe(true);
    });
  });
  
  describe('Memory Usage', () => {
    it('should not leak memory', async () => {
      // Test memory usage over multiple requests
    });
  });
});
```

### Frontend Performance

**File**: `tests/performance/frontend.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Frontend Performance', () => {
  test('should load page quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });
  
  test('should render code quickly', async ({ page }) => {
    // Test code rendering performance
  });
  
  test('should handle audio playback smoothly', async ({ page }) => {
    // Test audio performance
  });
});
```

---

## Prompt Quality Tests

### Using Claude's Testing Framework

**File**: `tests/prompts/quality.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../packages/backend/src/server';

// Test prompts from MODEL_TESTING_GUIDE.md
const TEST_PROMPTS = {
  basic: [
    'Create a simple drum beat',
    'Make a basic pattern with kick and snare',
  ],
  genres: [
    'Generate a jazz chord progression',
    'Create a hip-hop beat with 808s',
    'Make a techno track',
    'Create an ambient soundscape',
  ],
  advanced: [
    'Generate a polyrhythmic pattern',
    'Create a pattern with modulation',
    'Make a pattern with effects',
  ],
  refinement: [
    'Add hi-hats',
    'Make it faster',
    'Add reverb',
  ],
};

describe('Prompt Quality Tests', () => {
  describe('Basic Patterns', () => {
    TEST_PROMPTS.basic.forEach(prompt => {
      it(`should generate valid code for: "${prompt}"`, async () => {
        const response = await request(app)
          .post('/api/music/generate')
          .send({ prompt });
        
        expect(response.status).toBe(200);
        expect(response.body.data.code).toMatch(/s\(|n\(|stack\(/);
      });
    });
  });
  
  describe('Genre Accuracy', () => {
    it('should generate jazz-style code', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a jazz chord progression' });
      
      const code = response.body.data.code;
      expect(code).toMatch(/piano|gtr/);
      expect(code).toMatch(/maj7|min7/);
    });
    
    // Test other genres...
  });
  
  describe('Code Validity', () => {
    it('should generate syntactically valid Strudel code', async () => {
      const response = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'test' });
      
      const code = response.body.data.code;
      // Check for dangerous patterns
      expect(code).not.toMatch(/eval\(|Function\(|require\(/);
      // Check for valid Strudel syntax
      expect(code).toMatch(/s\(|n\(|setcps\(/);
    });
  });
  
  describe('Refinement Quality', () => {
    it('should preserve original code when refining', async () => {
      // Generate initial code
      const initial = await request(app)
        .post('/api/music/generate')
        .send({ prompt: 'create a beat' });
      
      // Refine
      const refined = await request(app)
        .post('/api/music/generate')
        .send({
          prompt: 'add hi-hats',
          conversationHistory: [
            { role: 'assistant', content: initial.body.data.code, timestamp: new Date() }
          ],
          refinement: true
        });
      
      // Verify original elements preserved
      const originalCode = initial.body.data.code;
      const refinedCode = refined.body.data.code;
      expect(refinedCode).toContain('hh'); // New element added
      // Original elements should still be present
    });
  });
});
```

### Model Comparison Tests

**File**: `tests/prompts/model-comparison.test.ts`

```typescript
describe('Model Comparison', () => {
  const models = [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/gpt-4-turbo',
  ];
  
  const testPrompt = 'create a house beat with piano';
  
  models.forEach(model => {
    describe(`Model: ${model}`, () => {
      it('should generate valid code', async () => {
        process.env.OPENROUTER_MODEL = model;
        // Test generation
      });
      
      it('should meet quality threshold', async () => {
        // Evaluate quality (1-5 scale)
      });
      
      it('should complete within time limit', async () => {
        // Measure response time
      });
    });
  });
});
```

---

## Test Execution

### Running Tests

**Add to `package.json`:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run packages",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:prompts": "vitest run tests/prompts",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run prompt quality tests
npm run test:prompts

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Test Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './packages/frontend/src'),
      '@kre8/shared': path.resolve(__dirname, './packages/shared/src'),
    },
  },
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test:integration
        env:
          USE_MOCK_AI: 'true'
          
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Test Coverage Goals

### Target Coverage

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths covered
- **E2E Tests**: All user workflows covered
- **Prompt Tests**: All test prompts from MODEL_TESTING_GUIDE.md

### Priority Areas

1. **High Priority**:
   - AI service (code generation)
   - API endpoints
   - Error handling
   - Prompt quality

2. **Medium Priority**:
   - Frontend components
   - Audio services
   - State management

3. **Low Priority**:
   - Utility functions
   - Type adapters

---

## Test Data Management

### Mock Data

**File**: `tests/fixtures/mock-responses.ts`

```typescript
export const mockOpenRouterResponse = {
  id: 'test-id',
  choices: [{
    message: {
      role: 'assistant',
      content: '```javascript\ns("bd sd").gain(0.9)\n```',
    },
    finish_reason: 'stop',
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

export const mockStrudelCode = {
  code: 's("bd sd").gain(0.9)',
  explanation: 'A simple drum beat',
  metadata: {
    tempo: 120,
    instruments: ['bd', 'sd'],
  },
};
```

### Test Utilities

**File**: `tests/utils/test-helpers.ts`

```typescript
export async function waitForCodeGeneration(page: Page) {
  await page.waitForSelector('[data-testid="code-panel"]', { timeout: 10000 });
}

export function createMockAudioBlob(): Blob {
  // Create mock audio blob for testing
}

export function createMockPrompt(prompt: string) {
  return {
    prompt,
    config: { tempo: 120 },
  };
}
```

---

## Next Steps

### Implementation Order

1. ✅ **Week 1**: Set up test infrastructure
   - Install dependencies
   - Configure Vitest and Playwright
   - Create test structure

2. ✅ **Week 2**: Unit tests
   - Backend services
   - Frontend components
   - Shared utilities

3. ✅ **Week 3**: Integration tests
   - API endpoints
   - Service interactions

4. ✅ **Week 4**: E2E and Performance
   - User workflows
   - Load testing
   - Performance benchmarks

5. ✅ **Ongoing**: Prompt quality tests
   - Use MODEL_TESTING_GUIDE.md
   - Track results in PROMPT_OPTIMIZATION_LOG.md

---

## Success Criteria

### Test Suite Success

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ 80%+ code coverage
- ✅ No critical bugs found

### Quality Metrics

- ✅ API response time < 5 seconds
- ✅ Page load time < 3 seconds
- ✅ Code generation success rate > 90%
- ✅ Prompt quality score > 4.0/5.0

---

**Status**: Ready for Implementation  
**Next Action**: Set up test infrastructure and begin with unit tests

