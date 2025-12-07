# Setup Guide

Complete setup instructions for the Kre8 voice-activated music generation app.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env and add your API keys
```

### 3. Build Shared Package
```bash
cd packages/shared
npm run build
cd ../..
```

### 4. Start Development
```bash
npm run dev
```

This runs:
- Backend on http://localhost:3001
- Frontend on http://localhost:5173

---

## API Key Configuration

### Option 1: xAI/Grok (Recommended)

If you have xAI Developer Console access:

1. Get your API key from [console.x.ai](https://console.x.ai)
2. Add to `.env`:
```bash
XAI_API_KEY=xai-your_actual_key_here
XAI_MODEL_CREATIVE=grok-4-1-fast-reasoning
XAI_MODEL_AGENT=grok-4-1-fast
XAI_MODEL_SIMPLE=grok-4-1-fast-non-reasoning
```

**Available Models**:
- `grok-4-1-fast-reasoning` - Best for creative tasks
- `grok-4-1-fast` - Balanced performance
- `grok-4-1-fast-non-reasoning` - Fastest, simple tasks

### Option 2: OpenRouter (Alternative)

1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Add to `.env`:
```bash
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=anthropic/claude-3-opus
```

### Option 3: Development Mode (No API Keys)

For development without API keys:
```bash
USE_MOCK_AI=true
```

---

## Development Commands

### Start Both Servers
```bash
npm run dev
```

### Start Individually

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

---

## Configuration Files

All configuration is file-based and can be edited without code changes:

### Prompt Templates
- `config/prompts/music_generation.txt` - Main generation prompt
- `config/prompts/refinement.txt` - Refinement prompt
- `config/prompts/few_shot_examples.json` - Example pairs

### Defaults
- `config/defaults.json` - Default tempo, scale, samples

### Models
- `config/models.json` - Available AI models

---

## Testing the Setup

1. Start the servers: `npm run dev`
2. Open http://localhost:5173
3. Try a simple prompt: "Create a simple drum beat"
4. Click "Generate" and wait for code
5. Click "Play" to hear the music

---

## Troubleshooting

### Strudel Not Working
- Check browser console for errors
- Ensure audio context is allowed (user interaction required)
- Verify @strudel/web package is installed

### API Errors
- Verify API keys in .env file
- Check backend logs for detailed error messages
- Ensure CORS_ORIGIN matches frontend URL
- For xAI: Check health endpoint: `curl http://localhost:3001/api/music/health`

### Build Errors
- Run `npm install` in root and each package
- Clear node_modules and reinstall if needed
- Check Node.js version (20+ required)

### xAI Specific Issues

**"XAI_API_KEY not configured"**
- Make sure `.env` file exists in project root
- Check that `XAI_API_KEY` is set (no quotes needed)
- Restart the backend server

**"401 Unauthorized"**
- Verify your API key is correct
- Check that billing is activated in xAI console
- Ensure you have credits remaining

---

## Quick Reference for Claude (Prompt Engineer)

**Your focus**: Refine prompts and test models

**Files to Edit**:
1. `config/prompts/music_generation.txt` - Main AI prompt
2. `config/prompts/refinement.txt` - Refinement prompt  
3. `config/prompts/few_shot_examples.json` - Example pairs
4. `.env` - Set model to test different models

**How It Works**:
1. User types/speaks: "Create a fast techno beat"
2. Backend loads prompt template from `config/prompts/music_generation.txt`
3. Renders template with user prompt, examples, defaults
4. Sends to xAI/Grok API (model specified in `.env`)
5. Extracts Strudel code from response
6. Frontend executes code via Strudel
7. User hears music!

**Key Code Locations**:
- **Prompt loading**: `packages/backend/src/services/configLoader.ts`
- **AI service**: `packages/backend/src/services/aiService.ts`
- **Template rendering**: `configLoader.ts` → `renderPrompt()`

---

## Next Steps

1. ✅ Test basic prompts
2. ✅ Try different models
3. ✅ Refine prompt templates
4. ✅ Add more few-shot examples
5. ✅ Document results in testing logs
