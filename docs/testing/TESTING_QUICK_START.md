# Testing Quick Start Guide

**Quick reference for running tests**

---

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run prompt quality tests
npm run test:prompts

# Run with coverage report
npm run test:coverage

# Run with UI (interactive)
npm run test:ui

# Watch mode (auto-rerun on changes)
npm run test:watch
```

---

## 📦 Installation

First, install test dependencies:

```bash
npm install --save-dev \
  vitest @vitest/ui \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  playwright @playwright/test \
  supertest \
  nock \
  msw
```

---

## 🧪 Test Structure

```
kre8/
├── packages/
│   ├── backend/src/__tests__/     # Backend unit tests
│   ├── frontend/src/__tests__/    # Frontend unit tests
│   └── shared/src/__tests__/      # Shared utilities tests
├── tests/
│   ├── integration/               # Integration tests
│   ├── e2e/                       # End-to-end tests
│   ├── performance/               # Performance tests
│   ├── prompts/                   # Prompt quality tests
│   └── fixtures/                  # Mock data
└── vitest.config.ts               # Test configuration
```

---

## ✅ Test Checklist

### Unit Tests
- [ ] Backend services (aiService, configLoader, whisperService)
- [ ] Backend routes (music, transcription, config)
- [ ] Backend middleware (rateLimiter, errorHandler)
- [ ] Frontend components (InputPanel, CodePanel, PlaybackControls)
- [ ] Frontend services (api, strudelService, audioRecorder)
- [ ] Frontend stores (appStore)
- [ ] Shared utilities (adapters, validators)

### Integration Tests
- [ ] Music generation flow
- [ ] Transcription flow
- [ ] Configuration endpoints
- [ ] Service interactions

### E2E Tests
- [ ] Generate code from text prompt
- [ ] Play generated music
- [ ] Voice input flow
- [ ] Audio download
- [ ] Code refinement

### Prompt Quality Tests
- [ ] Basic patterns (from MODEL_TESTING_GUIDE.md)
- [ ] Genre accuracy
- [ ] Code validity
- [ ] Refinement quality

---

## 📊 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: All user workflows
- **Prompt Tests**: All test prompts covered

---

## 🔧 Configuration

### Environment Variables for Testing

```bash
# .env.test
NODE_ENV=test
USE_MOCK_AI=true
PORT=3001
```

### Vitest Config

Already configured in `vitest.config.ts`:
- Test environment: Node.js
- Coverage provider: v8
- Setup file: `tests/setup.ts`

---

## 📝 Writing Tests

### Example: Backend Service Test

```typescript
// packages/backend/src/__tests__/services/aiService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateMusicCode } from '../../services/aiService';

describe('AI Service', () => {
  it('should generate code from prompt', async () => {
    const result = await generateMusicCode({
      prompt: 'create a beat',
    });
    
    expect(result.code).toBeDefined();
    expect(result.code).toContain('s(');
  });
});
```

### Example: Frontend Component Test

```typescript
// packages/frontend/src/__tests__/components/InputPanel.test.tsx
import { render, screen } from '@testing-library/react';
import InputPanel from '../InputPanel';

describe('InputPanel', () => {
  it('should render input field', () => {
    render(<InputPanel />);
    expect(screen.getByPlaceholderText(/describe/i)).toBeInTheDocument();
  });
});
```

---

## 🎯 Priority Order

1. **High Priority** (Start here):
   - AI service tests
   - API endpoint tests
   - Prompt quality tests

2. **Medium Priority**:
   - Frontend component tests
   - Integration tests

3. **Low Priority**:
   - Utility function tests
   - Performance tests

---

## 📚 Full Documentation

See `TESTING_PLAN.md` for complete testing plan with:
- Detailed test specifications
- Test examples
- Performance benchmarks
- CI/CD integration

---

**Status**: Ready to implement  
**Next**: Install dependencies and start with unit tests

