# Kre8 - Voice-Activated Live Coding Music Web App

A web-based application that generates music through natural language or voice commands, leveraging TidalCycles/Strudel code and AI. Create algorithmic music patterns just by describing what you want to hear.

## Features

- 🎤 **Voice Input**: Record voice commands or upload audio files for transcription
- ✍️ **Text Input**: Type natural language descriptions of music
- 🤖 **AI-Powered**: Uses OpenRouter to generate Strudel code from prompts
- 🎵 **Live Playback**: Play generated music directly in your browser using Strudel
- 💾 **Download Audio**: Record and download your creations as audio files
- ⚙️ **Configurable**: Edit prompt templates and model settings without code changes

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Audio Engine**: Strudel (@strudel/web) - TidalCycles for the browser
- **AI**: OpenRouter API (supports multiple models)
- **Speech-to-Text**: OpenAI Whisper API
- **Code Editor**: CodeMirror 6

## Project Structure

```
kre8/
├── packages/
│   ├── shared/          # Shared TypeScript types and schemas
│   ├── frontend/         # React frontend application
│   └── backend/          # Express API server
├── config/              # Configuration files (editable)
│   ├── prompts/         # AI prompt templates
│   ├── defaults.json    # Default music parameters
│   └── models.json      # Available AI models
└── docker-compose.yml   # Local development setup
```

## Quick Start

### Prerequisites

- Node.js 20+ and npm 9+
- API keys (optional for development):
  - OpenRouter API key (for AI music generation)
  - OpenAI API key (for Whisper transcription)
  
  **Note**: You can use `USE_MOCK_AI=true` for development without API keys

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kre8
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env and add your API keys (or set USE_MOCK_AI=true for development)
```

4. Start development servers:
```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend dev server on http://localhost:5173

### Using Docker

```bash
docker-compose up
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
WHISPER_API_KEY=your_openai_api_key

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Prompt Templates

Edit prompt templates in `config/prompts/`:
- `music_generation.txt` - Main prompt for generating music
- `refinement.txt` - Prompt for refining existing code
- `few_shot_examples.json` - Example prompt→code pairs

### Default Settings

Edit `config/defaults.json` to change default tempo, scale, key, and sample URLs.

## Usage

1. **Text Input**: Type a description like "Create a fast techno beat with hi-hats"
2. **Voice Input**: Click the microphone button and speak your request
3. **File Upload**: Upload an audio file for transcription
4. **Generate**: Click "Generate" to create Strudel code
5. **Play**: Use playback controls to play, stop, adjust tempo
6. **Record**: Record the audio output and download it

## API Endpoints

### Music Generation
- `POST /api/music/generate` - Generate Strudel code from prompt
- `GET /api/music/health` - Check service health

### Transcription
- `POST /api/transcription/transcribe` - Transcribe audio file
- `GET /api/transcription/health` - Check service health

### Configuration
- `GET /api/config/defaults` - Get default settings
- `GET /api/config/models` - Get available AI models
- `GET /api/config/examples` - Get few-shot examples

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will auto-detect the Dockerfile and deploy

### Manual Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

## Development

### Monorepo Structure

This project uses npm workspaces for monorepo management:

- `packages/shared` - Shared types and schemas
- `packages/backend` - Express API server
- `packages/frontend` - React application

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## License

AGPL-3.0 (due to Strudel's AGPL-3.0 license)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Strudel](https://strudel.tidalcycles.org/) - TidalCycles for the web
- [TidalCycles](https://tidalcycles.org/) - Live coding language for algorithmic music
- [OpenRouter](https://openrouter.ai/) - Unified API for AI models

