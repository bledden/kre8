# Quick Start Guide for Claude

## TL;DR

✅ **Complete technical implementation done**  
🎯 **Your job: Refine prompts and test models**  
📝 **No code changes needed - edit config files only**

## Files You Need to Edit

1. **`config/prompts/music_generation.txt`** - Main AI prompt
2. **`config/prompts/refinement.txt`** - Refinement prompt  
3. **`config/prompts/few_shot_examples.json`** - Example pairs
4. **`.env`** - Set `OPENROUTER_MODEL` to test different models

## How It Works

1. User types/speaks: "Create a fast techno beat"
2. Backend loads prompt template from `config/prompts/music_generation.txt`
3. Renders template with user prompt, examples, defaults
4. Sends to OpenRouter API (model specified in `.env`)
5. Extracts Strudel code from response
6. Frontend executes code via Strudel
7. User hears music!

## Test It

```bash
npm install
# Add API keys to .env
npm run dev
# Open http://localhost:5173
```

## Current Prompt Template Variables

- `{{defaults}}` - Loaded from `config/defaults.json`
- `{{examples}}` - Loaded from `config/prompts/few_shot_examples.json`
- `{{user_prompt}}` - User's input

## Key Code Locations

- **Prompt loading**: `packages/backend/src/services/configLoader.ts`
- **AI service**: `packages/backend/src/services/aiService.ts` (lines 30-140)
- **Template rendering**: `configLoader.ts` → `renderPrompt()`

## What to Focus On

1. ✅ Test current prompts with various inputs
2. ✅ Expand few-shot examples (currently only 4)
3. ✅ Refine system instructions for clarity
4. ✅ Test different models (Claude, GPT-4, Gemini)
5. ✅ Improve musical quality and coherence

## Full Details

See `CLAUDE_HANDOFF.md` for complete documentation.

