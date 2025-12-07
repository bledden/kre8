# Setting Up Grok Models

This guide explains how to configure the kre8 project to use xAI's Grok models.

## Current Model Configuration

The project currently uses **Anthropic Claude 3.5 Sonnet** as the default model, configured via the `OPENROUTER_MODEL` environment variable.

## ✅ Option 1: Using xAI API Directly (Recommended for Developer Console Users)

**If you have xAI Developer Console access with credits, this is the best option!**

The project now supports direct xAI API integration. No code changes needed - just configure environment variables.

### Step 1: Get Your xAI API Key

1. Visit [xAI Developer Console](https://console.x.ai)
2. Sign in with your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key (starts with `xai-...`)

### Step 2: Configure Environment Variables

Edit your `.env` file:

```bash
# Add these lines:
XAI_API_KEY=xai-your_api_key_here
XAI_MODEL=grok-beta

# Comment out or remove OpenRouter config (optional - xAI takes precedence)
# OPENROUTER_API_KEY=...
```

**Available Grok Models**:
- `grok-beta` - Beta version (recommended)
- `grok-2` - Latest Grok 2 model
- `grok-2-1212` - Specific Grok 2 variant
- `grok-2-vision-1212` - Grok 2 with vision capabilities

### Step 3: Restart Backend

```bash
npm run dev:backend
# OR if running both:
npm run dev
```

### Step 4: Verify Configuration

Check the health endpoint:

```bash
curl http://localhost:3001/api/music/health
```

You should see:
```json
{
  "success": true,
  "service": "music-generation",
  "mode": "real",
  "provider": "xai",
  "configured": true,
  "model": "grok-beta"
}
```

### Step 5: Test

Try generating music with a simple prompt:
- "Create a simple drum beat"
- "Make a house track at 125 BPM"

---

## Option 2: Using Grok via OpenRouter

If you prefer to use OpenRouter (or if you don't have direct xAI access), you can use Grok models through OpenRouter.

### Step 1: Check Model Availability

Visit [OpenRouter Models](https://openrouter.ai/models) and search for "grok" or "x-ai" to see available Grok models. Common model names might be:
- `x-ai/grok-beta`
- `x-ai/grok-2`
- `x-ai/grok-2-1212`

### Step 2: Update Environment Variable

Edit your `.env` file:

```bash
# Change from:
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# To (example):
OPENROUTER_MODEL=x-ai/grok-beta
```

### Step 3: Restart Backend

```bash
npm run dev:backend
# OR if running both:
npm run dev
```

### Step 4: Test

Try generating music with a simple prompt to verify it works:
- "Create a simple drum beat"
- "Make a house track at 125 BPM"

## How It Works

The project automatically detects which API to use based on environment variables:

1. **If `XAI_API_KEY` is set**: Uses xAI API directly (fastest, uses your credits)
2. **Otherwise, if `OPENROUTER_API_KEY` is set**: Uses OpenRouter API
3. **Otherwise**: Falls back to mock service (if `USE_MOCK_AI=true`)

**Priority**: xAI > OpenRouter > Mock

This means if you set both `XAI_API_KEY` and `OPENROUTER_API_KEY`, xAI will be used.

## Model Comparison

| Model | Provider | Speed | Cost | Best For |
|-------|----------|-------|------|----------|
| Grok Beta | xAI | Fast | Medium | General use |
| Grok 2 | xAI | Fast | Medium | Latest features |
| Grok 2 1212 | xAI | Fast | Medium | Specific variant |

## Testing Grok Models

Use the same testing methodology as other models (see `MODEL_TESTING_GUIDE.md`):

1. **Basic Patterns Test**: Simple prompts like "create a drum beat"
2. **Genre Tests**: "create a house track", "make hip-hop beat"
3. **Advanced Features**: Complex patterns with effects and modulation
4. **Refinement Tests**: Iterative improvements

Record results in `PROMPT_OPTIMIZATION_LOG.md` for comparison.

## Troubleshooting

### Model Not Found Error

If you get a "model not found" error:
1. Verify the exact model name on OpenRouter's website
2. Check that your OpenRouter API key has access to the model
3. Some models may require special access or credits

### API Errors

- **401 Unauthorized**: Check your API key
- **429 Rate Limited**: You've hit rate limits, wait or upgrade plan
- **500 Server Error**: xAI/OpenRouter service issue, try again later

### Code Generation Quality

If Grok produces lower quality code:
1. Review the prompt templates in `config/prompts/`
2. Add more few-shot examples if needed
3. Adjust temperature (lower = more deterministic)
4. Compare with Claude/GPT-4 results

## Current Status

✅ **Direct xAI API integration complete** - No code changes needed!  
✅ **Grok models added to `config/models.json`**  
✅ **Environment variable configuration ready**  
✅ **Automatic provider detection** - xAI takes precedence over OpenRouter  
✅ **Health endpoint shows active provider**  
⏳ **Testing needed** - Test with your xAI Developer Console credits

## Next Steps

1. Check OpenRouter for available Grok models
2. Test with `OPENROUTER_MODEL=x-ai/grok-beta` (or available variant)
3. Compare results with Claude 3.5 Sonnet
4. Document findings in `PROMPT_OPTIMIZATION_LOG.md`

