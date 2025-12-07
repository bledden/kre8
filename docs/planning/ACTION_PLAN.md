# Kre8 Hackathon Action Plan

**Competition**: xAI Hackathon (500 hand-picked participants)
**Goal**: Position Kre8 as a showcase of Grok's creative potential and a potential X/xAI platform feature
**Status**: In Development

---

## Phase 1: Core xAI Integration (HIGH PRIORITY)

These items directly showcase xAI's unique capabilities and differentiate Kre8 from competitors.

### 1.1 xAI STT Integration (Replace Whisper)
**Status**: Not Started
**Effort**: 3-4 hours
**Impact**: HIGH - 100% xAI stack, faster response, insider feature access

**Tasks**:
- [ ] Create `packages/backend/src/services/xaiVoiceService.ts`
- [ ] Implement STT using xAI `/v1/audio/transcriptions` endpoint
- [ ] Update `transcription.ts` routes to use xAI STT
- [ ] Test with microphone input
- [ ] Handle error cases (no speech detected, audio too long)

**Files to modify**:
- `packages/backend/src/services/whisperService.ts` → rename/replace
- `packages/backend/src/routes/transcription.ts`

---

### 1.2 xAI TTS Integration (Voice Feedback)
**Status**: Not Started
**Effort**: 3-4 hours
**Impact**: HIGH - Conversational UX, showcases full voice loop

**Tasks**:
- [ ] Add TTS function to `xaiVoiceService.ts`
- [ ] Implement using xAI `/v1/audio/speech` endpoint
- [ ] Create TTS route `POST /api/voice/speak`
- [ ] Add frontend audio playback component
- [ ] Integrate with music generation feedback ("Here's a lo-fi beat I created...")

**Files to create/modify**:
- `packages/backend/src/services/xaiVoiceService.ts`
- `packages/backend/src/routes/voice.ts` (new)
- `packages/frontend/src/components/VoiceFeedback.tsx` (new)

---

### 1.3 Agent Tools API Integration
**Status**: Not Started
**Effort**: 6-8 hours
**Impact**: VERY HIGH - Unique Grok feature, enables x_search, web_search, code_execution

**Tasks**:
- [ ] Create `packages/backend/src/services/agentToolsService.ts`
- [ ] Implement x_search tool calling for trending music topics
- [ ] Implement web_search for music inspiration
- [ ] Create route `POST /api/agent/search`
- [ ] Add "Inspire from X" button in frontend
- [ ] Display trending topics as music generation suggestions

**Use Cases**:
- "Create music inspired by what's trending on X right now"
- "Make a beat based on the vibe of [artist]'s latest tweets"
- "Generate music matching the mood of today's top news"

**Files to create**:
- `packages/backend/src/services/agentToolsService.ts`
- `packages/backend/src/routes/agent.ts`
- `packages/frontend/src/components/TrendingInspiration.tsx`

---

### 1.4 Image-to-Music (Vision)
**Status**: Not Started
**Effort**: 4-5 hours
**Impact**: HIGH - Multimodal showcase, unique creative feature

**Tasks**:
- [ ] Add image upload to frontend
- [ ] Create vision endpoint in backend
- [ ] Send image to Grok with vision capability
- [ ] Extract mood/style/tempo from image description
- [ ] Generate music based on visual analysis

**Files to create/modify**:
- `packages/backend/src/routes/music.ts` (add image handling)
- `packages/frontend/src/components/ImageUpload.tsx` (new)
- Update `InputPanel.tsx` to support image input

---

## Phase 2: Platform Integration (HIGH PRIORITY)

These items position Kre8 as a potential X/Grok platform feature.

### 2.1 Complete X OAuth Flow
**Status**: Backend Done, Frontend Partial
**Effort**: 2-3 hours
**Impact**: HIGH - User-generated content, viral potential

**Tasks**:
- [x] Backend OAuth 2.0 with PKCE
- [x] OAuth routes (authorize, callback, refresh)
- [x] Tweet posting service
- [ ] Get X_CLIENT_ID and X_CLIENT_SECRET from developer.x.com
- [ ] Test full OAuth flow end-to-end
- [ ] Store tokens securely (httpOnly cookies)
- [ ] Add "Share to X" to main UI

**Files to modify**:
- `.env` - Add OAuth credentials
- `packages/frontend/src/App.tsx` - Integrate ShareToX component

---

### 2.2 MCP Server Implementation
**Status**: Not Started
**Effort**: 8-10 hours
**Impact**: VERY HIGH - Positions Kre8 as Grok's music engine

**Tasks**:
- [ ] Create MCP server package
- [ ] Expose `generate_music` as MCP tool
- [ ] Expose `play_pattern` as MCP tool
- [ ] Expose `export_audio` as MCP tool
- [ ] Document MCP integration for Grok
- [ ] Test with MCP client

**Files to create**:
- `packages/mcp-server/` (new package)
- `packages/mcp-server/src/index.ts`
- `packages/mcp-server/src/tools/generateMusic.ts`
- `packages/mcp-server/src/tools/playPattern.ts`

---

### 2.3 "Powered by Grok" Branding
**Status**: Not Started
**Effort**: 1-2 hours
**Impact**: MEDIUM - Visual xAI alignment

**Tasks**:
- [ ] Add Grok logo/badge to header
- [ ] Add "Powered by Grok" footer
- [ ] Style consistent with xAI brand guidelines
- [ ] Add model info display (which Grok model is being used)

**Files to modify**:
- `packages/frontend/src/components/Header.tsx`
- `packages/frontend/src/App.tsx`
- Add xAI/Grok assets to `public/`

---

## Phase 3: Code Quality & Robustness

These items demonstrate engineering excellence to code reviewers.

### 3.1 LRU Cache for API Responses
**Status**: Not Started
**Effort**: 4 hours
**Impact**: HIGH - Cost control, performance, shows optimization thinking

**Tasks**:
- [ ] Install `lru-cache` package
- [ ] Create `packages/backend/src/services/cacheService.ts`
- [ ] Implement cache key generation (hash of prompt + config)
- [ ] Add cache check before API calls in `aiService.ts`
- [ ] Add cache stats endpoint `/api/config/cache/stats`
- [ ] Add cache invalidation for refinements

**Files to create/modify**:
- `packages/backend/src/services/cacheService.ts` (new)
- `packages/backend/src/services/aiService.ts`
- `packages/backend/src/routes/config.ts`

---

### 3.2 Result Pattern Error Handling
**Status**: Not Started
**Effort**: 6 hours
**Impact**: MEDIUM - Type safety, professional error handling

**Tasks**:
- [ ] Add Result type to `@kre8/shared`
- [ ] Update `generateMusicCode` to return `Result<StrudelCode, AIServiceError>`
- [ ] Update route handlers to handle Result
- [ ] Update frontend to handle structured errors
- [ ] Add retryable error indication to UI

**Files to modify**:
- `packages/shared/src/types.ts`
- `packages/backend/src/services/aiService.ts`
- `packages/backend/src/routes/music.ts`
- `packages/frontend/src/services/api.ts`

---

### 3.3 Request Deduplication
**Status**: Not Started
**Effort**: 3 hours
**Impact**: MEDIUM - Cost optimization, prevents duplicate requests

**Tasks**:
- [ ] Create `packages/backend/src/services/requestDeduplicator.ts`
- [ ] Implement pending request map with cleanup
- [ ] Wrap API calls in deduplication
- [ ] Add stats endpoint

**Files to create**:
- `packages/backend/src/services/requestDeduplicator.ts`

---

### 3.4 Retry Logic with Exponential Backoff
**Status**: Not Started
**Effort**: 3 hours
**Impact**: MEDIUM - Reliability, handles transient failures

**Tasks**:
- [ ] Create `packages/backend/src/utils/retry.ts`
- [ ] Implement exponential backoff
- [ ] Don't retry on 4xx errors
- [ ] Add jitter to prevent thundering herd
- [ ] Wrap API calls in retry logic

**Files to create**:
- `packages/backend/src/utils/retry.ts`

---

### 3.5 Extract Constants
**Status**: Not Started
**Effort**: 2 hours
**Impact**: LOW - Code quality, maintainability

**Tasks**:
- [ ] Create `packages/backend/src/services/constants.ts`
- [ ] Move magic numbers (timeouts, limits, etc.)
- [ ] Update all files to use constants

---

### 3.6 Streaming Support
**Status**: Not Started
**Effort**: 8 hours
**Impact**: HIGH - UX improvement, perceived performance

**Tasks**:
- [ ] Add streaming method to `aiService.ts`
- [ ] Create SSE endpoint `POST /api/music/generate/stream`
- [ ] Add frontend EventSource handling
- [ ] Show code appearing character-by-character
- [ ] Handle stream errors gracefully

**Files to modify**:
- `packages/backend/src/services/aiService.ts`
- `packages/backend/src/routes/music.ts`
- `packages/frontend/src/services/api.ts`
- `packages/frontend/src/components/CodePanel.tsx`

---

### 3.7 Code Validation
**Status**: Not Started
**Effort**: 2 hours
**Impact**: MEDIUM - Security, quality assurance

**Tasks**:
- [ ] Create `packages/backend/src/services/codeValidator.ts`
- [ ] Check for dangerous patterns (eval, require, fetch)
- [ ] Validate basic Strudel syntax
- [ ] Reject invalid code before sending to frontend

---

### 3.8 Request Logging/Monitoring
**Status**: Not Started
**Effort**: 3 hours
**Impact**: LOW - Observability, debugging

**Tasks**:
- [ ] Create `packages/backend/src/middleware/requestLogger.ts`
- [ ] Log request timing, status codes
- [ ] Expose `/health/detailed` endpoint
- [ ] Track slow requests

---

## Phase 4: Frontend Polish

### 4.1 Audio Export/Recording
**Status**: Not Started
**Effort**: 4-5 hours
**Impact**: HIGH - Users can save and share their creations

**Tasks**:
- [ ] Add Strudel recorder integration
- [ ] Create "Export Track" button
- [ ] Generate downloadable WAV/MP3
- [ ] Show recording progress indicator

---

### 4.2 Realtime Voice Mode
**Status**: Not Started
**Effort**: 8-10 hours
**Impact**: VERY HIGH - Conversational music creation

**Tasks**:
- [ ] Implement WebSocket connection to xAI Realtime API
- [ ] Create ephemeral token endpoint
- [ ] Build voice conversation UI
- [ ] Handle turn-taking
- [ ] Stream audio responses

---

### 4.3 UI/UX Improvements
**Status**: Not Started
**Effort**: 4-6 hours
**Impact**: MEDIUM - Demo polish

**Tasks**:
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add keyboard shortcuts
- [ ] Mobile responsiveness
- [ ] Dark/light mode toggle

---

## Phase 5: Licensing & Open Source

### 5.1 AGPL-3.0 Compliance
**Status**: Not Started
**Effort**: 2 hours
**Impact**: REQUIRED - Legal compliance for Strudel

**Tasks**:
- [ ] Add LICENSE file (AGPL-3.0)
- [ ] Add license headers to source files
- [ ] Document third-party licenses
- [ ] Ensure sample licenses are compatible

---

## Priority Matrix

| Priority | Item | Effort | Impact | Status |
|----------|------|--------|--------|--------|
| 🔴 P0 | xAI STT Integration | 4h | HIGH | Not Started |
| 🔴 P0 | xAI TTS Integration | 4h | HIGH | Not Started |
| 🔴 P0 | Agent Tools API | 8h | VERY HIGH | Not Started |
| 🔴 P0 | Image-to-Music | 5h | HIGH | Not Started |
| 🟠 P1 | Complete X OAuth | 3h | HIGH | Partial |
| 🟠 P1 | LRU Cache | 4h | HIGH | Not Started |
| 🟠 P1 | Streaming Support | 8h | HIGH | Not Started |
| 🟠 P1 | Audio Export | 5h | HIGH | Not Started |
| 🟡 P2 | MCP Server | 10h | VERY HIGH | Not Started |
| 🟡 P2 | Result Pattern | 6h | MEDIUM | Not Started |
| 🟡 P2 | Request Deduplication | 3h | MEDIUM | Not Started |
| 🟡 P2 | Retry Logic | 3h | MEDIUM | Not Started |
| 🟡 P2 | Code Validation | 2h | MEDIUM | Not Started |
| 🟢 P3 | Realtime Voice | 10h | VERY HIGH | Not Started |
| 🟢 P3 | Branding | 2h | MEDIUM | Not Started |
| 🟢 P3 | Constants | 2h | LOW | Not Started |
| 🟢 P3 | Request Logging | 3h | LOW | Not Started |
| 🟢 P3 | UI Polish | 6h | MEDIUM | Not Started |
| ⚪ P4 | AGPL Compliance | 2h | REQUIRED | Not Started |

---

## Estimated Total Effort

| Phase | Hours |
|-------|-------|
| Phase 1: Core xAI Integration | 16-21h |
| Phase 2: Platform Integration | 11-15h |
| Phase 3: Code Quality | 31h |
| Phase 4: Frontend Polish | 16-21h |
| Phase 5: Licensing | 2h |
| **Total** | **76-90h** |

---

## Recommended Execution Order

### Day 1: xAI Voice Stack
1. xAI STT Integration (4h)
2. xAI TTS Integration (4h)
3. Test voice loop end-to-end

### Day 2: Agent Tools & Vision
1. Agent Tools API - x_search (4h)
2. Image-to-Music (5h)
3. "Inspire from X" UI

### Day 3: Platform Integration
1. Complete X OAuth (3h)
2. Audio Export (5h)
3. "Powered by Grok" branding (2h)

### Day 4: Code Quality
1. LRU Cache (4h)
2. Retry Logic (3h)
3. Request Deduplication (3h)

### Day 5: UX & Polish
1. Streaming Support (8h)
2. Code Validation (2h)

### Day 6: Advanced Features
1. MCP Server (10h)

### Day 7: Final Polish
1. Result Pattern (6h)
2. UI improvements (4h)
3. Testing & bug fixes

---

## Success Metrics

- [ ] 100% xAI stack (no OpenAI/external dependencies)
- [ ] Voice input → Music output → Voice feedback loop working
- [ ] Agent Tools integration demo-ready
- [ ] Image-to-music working
- [ ] Share to X functional
- [ ] Code passes review (clean, documented, robust)
- [ ] < 5 second average generation time
- [ ] Zero crashes during demo

---

## Notes

- Keep `.env` secure - never commit API keys
- Test on multiple browsers before demo
- Prepare fallback demos in case of API issues
- Document any xAI-specific features for judges
