# Kre8 - Voice-Activated Live Coding Music Web App

A web-based application that generates music through natural language or voice commands, leveraging TidalCycles/Strudel code and xAI's Grok models. Create algorithmic music patterns just by describing what you want to hear.

## Features

- **Voice Input**: Record voice commands with xAI STT transcription
- **Text Input**: Type natural language descriptions of music
- **AI-Powered**: Uses xAI Grok models for intelligent music generation
- **Live Playback**: Play generated music directly in your browser using Strudel
- **Voice Feedback**: Optional TTS responses using xAI voices
- **Share to X**: Connect your X account to share your creations
- **Download Audio**: Record and download your creations as audio files
- **Configurable**: Edit prompt templates and model settings without code changes

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Audio Engine**: Strudel (@strudel/web) - TidalCycles for the browser
- **AI**: xAI Grok API (task-specific model routing)
- **Speech**: xAI STT (transcription) & TTS (voice feedback)
- **Social**: X Platform OAuth 2.0 integration
- **Code Editor**: CodeMirror 6

## Project Structure

```
kre8/
├── packages/
│   ├── shared/          # Shared TypeScript types and schemas
│   ├── frontend/        # React frontend application
│   └── backend/         # Express API server
├── config/              # Configuration files (editable)
│   ├── prompts/         # AI prompt templates
│   ├── defaults.json    # Default music parameters
│   └── models.json      # Available AI models
└── docker-compose.yml   # Local development setup
```

## Quick Start

### Prerequisites

- Node.js 20+ and npm 9+
- xAI API key from [console.x.ai](https://console.x.ai)
- X Developer credentials (optional, for Share to X)

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
# Edit .env and add your xAI API key
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

Create a `.env` file in the root directory (see `env.example` for full template):

```bash
# xAI API (required) - single key for all services
XAI_API_KEY=your_xai_api_key

# Model routing (optional - defaults shown)
XAI_MODEL_CREATIVE=grok-4-1-fast-reasoning
XAI_MODEL_AGENT=grok-4-1-fast
XAI_MODEL_SIMPLE=grok-4-1-fast-non-reasoning

# TTS voice (optional)
XAI_TTS_VOICE=Eve

# X Platform (optional)
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret

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
7. **Share**: Connect your X account and share your creations

## API Endpoints

### Music Generation
- `POST /api/music/generate` - Generate Strudel code from prompt
- `GET /api/music/health` - Check service health

### Speech (STT & TTS)
- `POST /api/transcription/transcribe` - Transcribe audio file to text
- `POST /api/transcription/speak` - Generate speech from text
- `GET /api/transcription/voices` - List available TTS voices
- `GET /api/transcription/health` - Check service health

### X Platform
- `GET /api/x/auth` - Initiate X OAuth flow
- `GET /api/x/callback` - OAuth callback handler
- `POST /api/x/post` - Post to X (authenticated)

### Configuration
- `GET /api/config/defaults` - Get default settings
- `GET /api/config/models` - Get available AI models
- `GET /api/config/examples` - Get few-shot examples

## xAI Model Routing

Kre8 uses task-specific model routing for optimal performance:

| Task Type | Model | Use Case |
|-----------|-------|----------|
| Creative | `grok-4-1-fast-reasoning` | Music generation, image-to-music, full tracks |
| Agent | `grok-4-1-fast` | X search, web search, tool calling |
| Simple | `grok-4-1-fast-non-reasoning` | Voice feedback, error messages |

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
- [xAI](https://x.ai/) - Grok models powering AI generation and speech
