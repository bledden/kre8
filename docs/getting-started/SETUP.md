# Setup Guide

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # - OPENROUTER_API_KEY (get from https://openrouter.ai)
   # - WHISPER_API_KEY or OPENAI_API_KEY (for transcription)
   ```

3. **Build Shared Package**
   ```bash
   cd packages/shared
   npm run build
   cd ../..
   ```

## Development

### Start Both Servers
```bash
npm run dev
```

This runs:
- Backend on http://localhost:3001
- Frontend on http://localhost:5173

### Start Individually

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

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

## Testing the Setup

1. Start the servers: `npm run dev`
2. Open http://localhost:5173
3. Try a simple prompt: "Create a simple drum beat"
4. Click "Generate" and wait for code
5. Click "Play" to hear the music

## Troubleshooting

### Strudel Not Working
- Check browser console for errors
- Ensure audio context is allowed (user interaction required)
- Verify @strudel/web package is installed

### API Errors
- Verify API keys in .env file
- Check backend logs for detailed error messages
- Ensure CORS_ORIGIN matches frontend URL

### Build Errors
- Run `npm install` in root and each package
- Clear node_modules and reinstall if needed
- Check Node.js version (20+ required)

