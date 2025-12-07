// Load .env FIRST before any other imports that depend on env vars
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

// Now import everything else
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { musicRoutes } from './routes/music.js';
import { transcriptionRoutes } from './routes/transcription.js';
import { realtimeRoutes } from './routes/realtime.js';
import { configRoutes } from './routes/config.js';
import { xRoutes } from './routes/x.js';
import { voiceRoutes } from './routes/voice.js';
import { feedbackRoutes } from './routes/feedback.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/music', musicRoutes);
app.use('/api/transcription', transcriptionRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/x', xRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling
app.use(errorHandler);

// Start server only if not in test environment and not imported as module
if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;

