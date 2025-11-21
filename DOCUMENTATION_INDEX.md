# kre8 Project Documentation Index

Quick reference to all project documentation files.

---

## 🚀 Getting Started

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](README.md) | Main project overview and setup instructions | 10 min |
| [QUICK_START.md](QUICK_START.md) | Quick start for Claude (prompt engineering focus) | 3 min |
| [SETUP.md](SETUP.md) | Detailed setup and development guide | 15 min |

**Start here if**: You're new to the project → Read [README.md](README.md) first.

---

## 👥 Handoff Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md) | Composer's handoff to Claude with complete file inventory | Claude |
| [HANDOFF_SUMMARY.md](HANDOFF_SUMMARY.md) | Claude's original handoff summary for Composer | Composer |
| [CLAUDE_PHASE2_COMPLETE.md](CLAUDE_PHASE2_COMPLETE.md) | Claude's Phase 2 completion summary | Both |

**Start here if**:
- Composer needs to catch up → Read [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md)
- Claude needs context → Read [QUICK_START.md](QUICK_START.md)

---

## 🏗️ Architecture & Technical

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Complete technical architecture and design decisions | 30 min |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | High-level project summary | 5 min |
| [GIT_COMMIT_SUMMARY.md](GIT_COMMIT_SUMMARY.md) | Git commit history and changelog | 5 min |

**Start here if**: You need to understand the technical implementation → [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🎵 Prompt Engineering (Configuration)

| Document | Purpose | Status |
|----------|---------|--------|
| [config/prompts/music_generation.txt](config/prompts/music_generation.txt) | Main generation prompt template | ✅ v2.0 |
| [config/prompts/refinement.txt](config/prompts/refinement.txt) | Refinement prompt template | ✅ v2.0 |
| [config/prompts/few_shot_examples.json](config/prompts/few_shot_examples.json) | Few-shot examples (20 examples, 13+ genres) | ✅ v2.0 |
| [config/defaults.json](config/defaults.json) | Default music parameters | ✅ v1.0 |
| [config/models.json](config/models.json) | Available AI models configuration | ✅ v1.0 |

**Edit these if**: You want to improve prompt quality, add examples, or test models.

---

## 📊 Testing & Optimization

| Document | Purpose | Status |
|----------|---------|--------|
| **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)** | **Testing overview - START HERE** | ✅ Complete |
| [TESTING_QUICK_START.md](TESTING_QUICK_START.md) | Quick reference for automated tests (`npm test`) | ✅ Complete |
| [TESTING_PLAN.md](TESTING_PLAN.md) | Complete technical testing plan (unit, integration, E2E) | ✅ Complete |
| [PROMPT_QUALITY_TESTING_PLAN.md](PROMPT_QUALITY_TESTING_PLAN.md) | Manual AI prompt testing (27 prompts, scoring rubrics) | ✅ Ready |
| [MODEL_TESTING_GUIDE.md](MODEL_TESTING_GUIDE.md) | Systematic model comparison (7 models, cost analysis) | ✅ Ready |
| [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md) | Track prompt iterations, testing results, improvements | ✅ Framework ready |

**Start here if**: You're testing → Read [TESTING_SUMMARY.md](TESTING_SUMMARY.md) to navigate all testing docs.

---

## 📁 Quick File Reference

### Root Configuration
```
kre8/
├── README.md                          # Main documentation
├── ARCHITECTURE.md                    # Technical architecture
├── SETUP.md                           # Setup guide
├── QUICK_START.md                     # Quick start for Claude
├── DOCUMENTATION_INDEX.md             # This file
├── package.json                       # Monorepo workspace
├── tsconfig.json                      # TypeScript root config
├── .gitignore                         # Git ignore
├── .eslintrc.json                     # ESLint config
├── docker-compose.yml                 # Docker local dev
├── Dockerfile                         # Production build
└── .env                               # Environment variables (not in git)
```

### Prompt Configuration (Your Primary Work Area)
```
config/
├── defaults.json                      # Default music parameters
├── models.json                        # AI models configuration
└── prompts/
    ├── music_generation.txt           # Main generation prompt ⭐
    ├── refinement.txt                 # Refinement prompt ⭐
    └── few_shot_examples.json         # Example pairs ⭐
```

### Shared Types
```
packages/shared/
└── src/
    ├── types.ts                       # Core TypeScript interfaces
    ├── schemas.ts                     # Zod validation schemas
    └── index.ts                       # Package exports
```

### Backend
```
packages/backend/
└── src/
    ├── server.ts                      # Express server
    ├── routes/
    │   ├── music.ts                   # Music generation endpoint
    │   ├── transcription.ts           # Speech-to-text endpoint
    │   └── config.ts                  # Config endpoints
    ├── services/
    │   ├── aiService.ts               # OpenRouter integration ⭐
    │   ├── whisperService.ts          # Whisper API
    │   └── configLoader.ts            # Loads prompt templates ⭐
    └── middleware/
        ├── rateLimiter.ts             # Rate limiting
        └── errorHandler.ts            # Error handling
```

### Frontend
```
packages/frontend/
└── src/
    ├── App.tsx                        # Main app component
    ├── stores/appStore.ts             # Zustand state
    ├── services/
    │   ├── api.ts                     # API client
    │   ├── strudelService.ts          # Strudel audio engine
    │   └── audioRecorder.ts           # Audio recording
    └── components/
        ├── Header.tsx                 # App header
        ├── InputPanel.tsx             # Input controls
        ├── CodePanel.tsx              # CodeMirror editor
        └── PlaybackControls.tsx       # Playback controls
```

### Documentation
```
docs/ (or root-level .md files)
├── CLAUDE_HANDOFF.md                  # Composer → Claude handoff
├── HANDOFF_SUMMARY.md                 # Claude → Composer handoff
├── CLAUDE_PHASE2_COMPLETE.md          # Phase 2 completion summary
├── PROMPT_OPTIMIZATION_LOG.md         # Testing and optimization log
├── MODEL_TESTING_GUIDE.md             # Model testing framework
├── PROJECT_SUMMARY.md                 # Project overview
└── GIT_COMMIT_SUMMARY.md              # Git history
```

---

## 🎯 By Task

### I want to...

#### ...understand the project
→ Read [README.md](README.md) → [ARCHITECTURE.md](ARCHITECTURE.md)

#### ...set up the development environment
→ Read [SETUP.md](SETUP.md)

#### ...improve prompt quality
→ Edit [config/prompts/music_generation.txt](config/prompts/music_generation.txt)
→ Reference [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md)

#### ...add more genre examples
→ Edit [config/prompts/few_shot_examples.json](config/prompts/few_shot_examples.json)

#### ...test different AI models
→ Read [MODEL_TESTING_GUIDE.md](MODEL_TESTING_GUIDE.md)
→ Edit `.env` → Change `OPENROUTER_MODEL`

#### ...write and run tests
→ Read [TESTING_PLAN.md](TESTING_PLAN.md) (complete plan)
→ Read [TESTING_QUICK_START.md](TESTING_QUICK_START.md) (quick reference)
→ Run `npm test` to execute tests

#### ...understand the handoff
→ Claude: Read [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md)
→ Composer: Read [CLAUDE_PHASE2_COMPLETE.md](CLAUDE_PHASE2_COMPLETE.md)

#### ...understand how prompts are loaded
→ Read [packages/backend/src/services/configLoader.ts](packages/backend/src/services/configLoader.ts)
→ Read [packages/backend/src/services/aiService.ts](packages/backend/src/services/aiService.ts)

#### ...understand the API endpoints
→ Read [packages/backend/src/routes/music.ts](packages/backend/src/routes/music.ts)
→ Read [packages/backend/src/routes/transcription.ts](packages/backend/src/routes/transcription.ts)

#### ...understand the frontend
→ Read [packages/frontend/src/App.tsx](packages/frontend/src/App.tsx)
→ Read [packages/frontend/src/stores/appStore.ts](packages/frontend/src/stores/appStore.ts)

---

## 📋 By Role

### For Composer (Infrastructure Developer)

**Primary Documents**:
1. [CLAUDE_PHASE2_COMPLETE.md](CLAUDE_PHASE2_COMPLETE.md) - What Claude completed
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Technical decisions
3. [SETUP.md](SETUP.md) - Development setup

**Optional**:
- [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md) - See what's being tested
- [MODEL_TESTING_GUIDE.md](MODEL_TESTING_GUIDE.md) - Understand model selection

**Work Area**:
- Backend code (`packages/backend/`)
- Frontend code (`packages/frontend/`)
- Infrastructure (Docker, Railway config)

---

### For Claude (Prompt Engineer)

**Primary Documents**:
1. [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md) - Composer's handoff
2. [QUICK_START.md](QUICK_START.md) - Quick reference
3. [PROMPT_OPTIMIZATION_LOG.md](PROMPT_OPTIMIZATION_LOG.md) - Track improvements

**Work Area**:
- [config/prompts/music_generation.txt](config/prompts/music_generation.txt) - Main prompt ⭐
- [config/prompts/refinement.txt](config/prompts/refinement.txt) - Refinement ⭐
- [config/prompts/few_shot_examples.json](config/prompts/few_shot_examples.json) - Examples ⭐
- `.env` - Model selection

**Reference**:
- [MODEL_TESTING_GUIDE.md](MODEL_TESTING_GUIDE.md) - How to test models
- [packages/backend/src/services/aiService.ts](packages/backend/src/services/aiService.ts) - How prompts are used

---

### For Users/Contributors

**Start Here**:
1. [README.md](README.md) - Project overview
2. [SETUP.md](SETUP.md) - How to run locally
3. [ARCHITECTURE.md](ARCHITECTURE.md) - How it works

**Contributing**:
- Adding examples: Edit [config/prompts/few_shot_examples.json](config/prompts/few_shot_examples.json)
- Reporting issues: See [README.md](README.md) for contribution guidelines
- Understanding prompts: Read [config/prompts/music_generation.txt](config/prompts/music_generation.txt)

---

## 🔄 Workflow Reference

### Development Workflow
```
1. Edit code in packages/
2. npm run dev (runs frontend + backend)
3. Test at http://localhost:5173
4. Commit changes
```

### Prompt Iteration Workflow
```
1. Edit config/prompts/*.txt or *.json
2. Restart backend (auto-reloads prompts)
3. Test with various prompts
4. Document results in PROMPT_OPTIMIZATION_LOG.md
5. Iterate
```

### Model Testing Workflow
```
1. Read MODEL_TESTING_GUIDE.md
2. Edit .env → Change OPENROUTER_MODEL
3. Restart backend
4. Run standardized test suite
5. Record results in PROMPT_OPTIMIZATION_LOG.md
6. Compare models
7. Select best model for production
```

---

## 📊 Version History

### Documentation Versions

| Version | Date | Changes |
|---------|------|---------|
| **v2.0** | 2025-11-20 | Claude Phase 2: Enhanced prompts, 20 examples, testing framework |
| **v1.0** | 2025-11-20 | Composer Phase 1: Complete infrastructure, basic prompts |

---

## 🆘 Common Questions

### Where do I...

**...change the default AI model?**
→ Edit `.env` → Change `OPENROUTER_MODEL`

**...add a new music genre example?**
→ Edit [config/prompts/few_shot_examples.json](config/prompts/few_shot_examples.json) → Add new object

**...improve prompt quality?**
→ Edit [config/prompts/music_generation.txt](config/prompts/music_generation.txt)

**...test a specific model?**
→ Read [MODEL_TESTING_GUIDE.md](MODEL_TESTING_GUIDE.md) → Follow testing methodology

**...understand how prompts are rendered?**
→ Read [packages/backend/src/services/configLoader.ts](packages/backend/src/services/configLoader.ts)

**...find the API endpoints?**
→ [packages/backend/src/routes/music.ts](packages/backend/src/routes/music.ts) (generation)
→ [packages/backend/src/routes/transcription.ts](packages/backend/src/routes/transcription.ts) (voice)

**...see what Composer built?**
→ Read [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md) (complete file inventory)

**...see what Claude improved?**
→ Read [CLAUDE_PHASE2_COMPLETE.md](CLAUDE_PHASE2_COMPLETE.md)

---

## 📦 Project Structure Summary

```
kre8/
├── 📄 Documentation (15 .md files)
│   ├── README.md, ARCHITECTURE.md, SETUP.md (Core docs)
│   ├── CLAUDE_HANDOFF.md, CLAUDE_PHASE2_COMPLETE.md (Handoffs)
│   └── PROMPT_OPTIMIZATION_LOG.md, MODEL_TESTING_GUIDE.md (Testing)
│
├── ⚙️ Configuration (Config files)
│   ├── config/prompts/ (Prompt templates) ⭐ Edit these
│   ├── config/defaults.json (Music defaults)
│   └── .env (Environment variables)
│
├── 📦 Packages (Source code)
│   ├── packages/shared/ (TypeScript types)
│   ├── packages/backend/ (Express API)
│   └── packages/frontend/ (React app)
│
└── 🐳 Deployment (Docker, Railway)
    ├── Dockerfile, docker-compose.yml
    └── .railway.json
```

**Total**: ~51 source files + 15 documentation files = 66 files

---

## 🎯 Current Status (2025-11-20)

### What's Complete ✅
- ✅ Full-stack application (Composer - Phase 1)
- ✅ Enhanced prompts with 20 examples (Claude - Phase 2)
- ✅ Comprehensive documentation (Both)
- ✅ Testing framework (Claude - Phase 2)

### What's In Progress ⏳
- ⏳ Systematic model testing (Claude - Phase 2)
- ⏳ Real-world usage validation

### What's Next 🔜
- 🔜 Model comparison and selection
- 🔜 Prompt iteration based on test results
- 🔜 Production deployment

---

## 📞 Contact & Support

**Composer**: Infrastructure, code, technical implementation
**Claude**: Prompt engineering, model testing, optimization

**Collaboration**: Both working in parallel on separate concerns with zero overlap.

---

**Last Updated**: 2025-11-20
**Maintained By**: Composer (infrastructure) + Claude (prompts)
**Status**: Phase 2 Complete, Ready for Testing
