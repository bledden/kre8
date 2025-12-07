import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio, textToSpeech, getContentTypeForFormat, TTS_VOICES, TTS_FORMATS, type TTSVoice, type TTSFormat } from '../services/speechService.js';

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
 * POST /api/transcription/speak
 * Generate speech from text using xAI TTS
 */
transcriptionRoutes.post('/speak', async (req, res, next) => {
  try {
    const { text, voice, format, speed } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Text is required' },
      });
      return;
    }

    if (text.length > 4096) {
      res.status(400).json({
        success: false,
        error: { message: 'Text cannot exceed 4096 characters' },
      });
      return;
    }

    // Validate voice if provided
    if (voice && !TTS_VOICES.includes(voice)) {
      res.status(400).json({
        success: false,
        error: { message: `Invalid voice. Available: ${TTS_VOICES.join(', ')}` },
      });
      return;
    }

    // Validate format if provided
    const outputFormat: TTSFormat = format || 'mp3';
    if (!TTS_FORMATS.includes(outputFormat)) {
      res.status(400).json({
        success: false,
        error: { message: `Invalid format. Available: ${TTS_FORMATS.join(', ')}` },
      });
      return;
    }

    const audioBuffer = await textToSpeech(text, {
      voice: voice as TTSVoice,
      format: outputFormat,
      speed: speed || 1.0,
    });

    res.set('Content-Type', getContentTypeForFormat(outputFormat));
    res.set('Content-Length', audioBuffer.length.toString());
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transcription/voices
 * List available TTS voices
 */
transcriptionRoutes.get('/voices', (req, res) => {
  res.json({
    success: true,
    data: {
      voices: TTS_VOICES,
      formats: TTS_FORMATS,
      default: {
        voice: process.env.XAI_TTS_VOICE || 'Eve',
        format: 'mp3',
        speed: 1.0,
      },
    },
  });
});

/**
 * GET /api/transcription/health
 * Check speech service health
 */
transcriptionRoutes.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'speech',
    provider: 'xai',
    capabilities: ['stt', 'tts'],
    configured: !!process.env.XAI_API_KEY,
  });
});

