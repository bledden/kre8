# Setting Up Grok Models

This guide explains how to configure the kre8 project to use xAI's Grok models.

## Current Model Configuration

The project currently uses **Anthropic Claude 3.5 Sonnet** as the default model, configured via the `OPENROUTER_MODEL` environment variable.

## Option 1: Using Grok via OpenRouter (Recommended)

If OpenRouter supports Grok models, this is the easiest approach as it requires no code changes.

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

## Option 2: Using xAI API Directly

If Grok models aren't available on OpenRouter, you can use xAI's API directly. This requires code modifications.

### Step 1: Get xAI API Key

1. Visit [xAI Console](https://console.x.ai)
2. Sign up or log in
3. Generate an API key
4. Note: Billing activation may be required

### Step 2: Add Environment Variable

Add to your `.env` file:

```bash
XAI_API_KEY=your_xai_api_key_here
XAI_MODEL=grok-beta  # or grok-2, grok-2-1212, etc.
```

### Step 3: Modify AI Service

You would need to modify `packages/backend/src/services/aiService.ts` to add support for xAI's API endpoint. The xAI API uses a similar format to OpenAI:

```typescript
// Example xAI API endpoint
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
```

**Note**: This requires implementing a new service or modifying the existing one to support both OpenRouter and xAI APIs.

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

✅ **Grok models added to `config/models.json`**  
✅ **Environment variable configuration ready**  
⏳ **Testing needed** - Verify model names work with OpenRouter  
⏳ **Direct xAI API integration** - Requires code changes if OpenRouter doesn't support Grok

## Next Steps

1. Check OpenRouter for available Grok models
2. Test with `OPENROUTER_MODEL=x-ai/grok-beta` (or available variant)
3. Compare results with Claude 3.5 Sonnet
4. Document findings in `PROMPT_OPTIMIZATION_LOG.md`

