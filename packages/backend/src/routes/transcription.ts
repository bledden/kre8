import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/whisperService.js';

export const transcriptionRoutes = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('File must be an audio file'));
    }
  },
});

/**
 * POST /api/transcription/transcribe
 * Transcribe audio file to text
 */
transcriptionRoutes.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No audio file provided' },
      });
      return;
    }

    const result = await transcribeAudio(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transcription/health
 * Check transcription service health
 */
transcriptionRoutes.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'transcription',
    configured: !!(process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY),
  });
});

