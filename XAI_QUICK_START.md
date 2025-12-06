# Quick Start: Using xAI Grok with Your Developer Console Credits

You have xAI Developer Console access with $500 credits! Here's how to set it up in 2 minutes.

## Setup Steps

### 1. Get Your API Key

1. Go to [console.x.ai](https://console.x.ai)
2. Sign in
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy the key (it starts with `xai-...`)

### 2. Configure `.env` File

Edit `.env` in the project root:

```bash
# Add your xAI API key
XAI_API_KEY=xai-your_actual_key_here

# Choose your Grok model
XAI_MODEL=grok-beta

# Optional: Comment out OpenRouter if you want to use xAI exclusively
# OPENROUTER_API_KEY=...
```

**Available Models**:
- `grok-beta` ← **Recommended for most use cases**
- `grok-2` ← Latest version
- `grok-2-1212` ← Specific variant
- `grok-2-vision-1212` ← With vision capabilities

### 3. Start the Server

```bash
npm run dev
```

### 4. Verify It's Working

```bash
curl http://localhost:3001/api/music/health
```

You should see:
```json
{
  "provider": "xai",
  "model": "grok-beta",
  "configured": true
}
```

### 5. Test It!

Open http://localhost:5173 and try:
- "Create a simple drum beat"
- "Make a house track at 125 BPM"
- "Generate a jazz chord progression"

## Your Credits

With $500 credits, you can make approximately:
- **~50,000 requests** (assuming ~$0.01 per request average)
- **Much more** if using simpler prompts

Monitor usage at: https://console.x.ai

## Troubleshooting

### "XAI_API_KEY not configured"
- Make sure `.env` file exists in project root
- Check that `XAI_API_KEY` is set (no quotes needed)
- Restart the backend server

### "401 Unauthorized"
- Verify your API key is correct
- Check that billing is activated in xAI console
- Ensure you have credits remaining

### Still Using OpenRouter?
- Check that `XAI_API_KEY` is set correctly
- xAI takes precedence, so if both are set, xAI will be used
- Check health endpoint to see which provider is active

## Next Steps

1. ✅ Test basic prompts
2. ✅ Try different Grok models
3. ✅ Compare quality with Claude/GPT-4
4. ✅ Document results in `PROMPT_OPTIMIZATION_LOG.md`

Enjoy your $500 credits! 🎵

