import { Router } from 'express';
import multer from 'multer';
import {
  cloneVoice,
  generateMultiVoice,
  generateVocalSample,
  getContentTypeForFormat,
} from '../services/speechService.js';

export const voiceRoutes = Router();

// Configure multer for voice sample uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for voice samples
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
 * POST /api/voice/clone
 * Clone a voice from a sample and generate speech
 * Requires consent confirmation for voice samples
 */
voiceRoutes.post('/clone', upload.single('voiceSample'), async (req, res, next) => {
  try {
    const { text, instructions, format, consentConfirmed } = req.body;

    // Validate consent for voice cloning
    if (req.file && consentConfirmed !== 'true') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Voice cloning requires consent confirmation. Please confirm that you have permission to use this voice sample.',
          code: 'CONSENT_REQUIRED',
        },
      });
      return;
    }

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

    const outputFormat = format === 'wav' ? 'wav' : 'mp3';

    const audioBuffer = await cloneVoice({
      text,
      voiceSample: req.file?.buffer,
      instructions: instructions || 'audio',
      format: outputFormat,
    });

    res.set('Content-Type', getContentTypeForFormat(outputFormat));
    res.set('Content-Length', audioBuffer.length.toString());
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/voice/sample
 * Generate a vocal sample for use in Strudel patterns
 * Returns audio as base64 data URL
 */
voiceRoutes.post('/sample', upload.single('voiceSample'), async (req, res, next) => {
  try {
    const { text, instructions, consentConfirmed } = req.body;

    // Validate consent for voice cloning
    if (req.file && consentConfirmed !== 'true') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Voice cloning requires consent confirmation.',
          code: 'CONSENT_REQUIRED',
        },
      });
      return;
    }

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Text is required' },
      });
      return;
    }

    if (text.length > 500) {
      res.status(400).json({
        success: false,
        error: { message: 'Vocal samples should be short (max 500 characters) for best results in beats' },
      });
      return;
    }

    const result = await generateVocalSample(
      text,
      req.file?.buffer,
      instructions
    );

    res.json({
      success: true,
      data: {
        dataUrl: result.dataUrl,
        format: result.format,
        size: result.audioBuffer.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/voice/multi
 * Generate multi-voice audio (layered vocals, harmonies)
 * Requires consent for all voice samples
 */
voiceRoutes.post('/multi', upload.array('voiceSamples', 4), async (req, res, next) => {
  try {
    const { voices: voicesJson, script: scriptJson, format, consentConfirmed } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    // Validate consent
    if (files && files.length > 0 && consentConfirmed !== 'true') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Voice cloning requires consent confirmation for all voice samples.',
          code: 'CONSENT_REQUIRED',
        },
      });
      return;
    }

    // Parse voices and script from JSON
    let voices: Array<{ id: string; instructions?: string }>;
    let script: Array<{ speakerId: string; text: string }>;

    try {
      voices = JSON.parse(voicesJson || '[]');
      script = JSON.parse(scriptJson || '[]');
    } catch {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid JSON format for voices or script' },
      });
      return;
    }

    if (!Array.isArray(voices) || voices.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'At least one voice is required' },
      });
      return;
    }

    if (!Array.isArray(script) || script.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Script with at least one turn is required' },
      });
      return;
    }

    // Match voice samples to voice definitions by index
    const voicesWithSamples = voices.map((voice, index) => ({
      id: voice.id,
      sample: files?.[index]?.buffer,
      instructions: voice.instructions,
    }));

    const outputFormat = format === 'wav' ? 'wav' : 'mp3';

    const audioBuffer = await generateMultiVoice({
      voices: voicesWithSamples,
      script,
      format: outputFormat,
    });

    res.set('Content-Type', getContentTypeForFormat(outputFormat));
    res.set('Content-Length', audioBuffer.length.toString());
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/voice/presets
 * Get preset voice descriptions for quick use
 */
voiceRoutes.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: {
      presets: [
        { id: 'male-deep', name: 'Deep Male', instructions: 'deep male voice, resonant, aged 35-45' },
        { id: 'female-soft', name: 'Soft Female', instructions: 'soft female voice, gentle, aged 25-35' },
        { id: 'male-energetic', name: 'Energetic Male', instructions: 'energetic young male, upbeat, aged 20-30' },
        { id: 'female-powerful', name: 'Powerful Female', instructions: 'powerful female voice, confident, aged 30-40' },
        { id: 'robotic', name: 'Robotic', instructions: 'robotic voice, synthesized, electronic' },
        { id: 'whisper', name: 'Whisper', instructions: 'whispered voice, breathy, intimate' },
        { id: 'radio-dj', name: 'Radio DJ', instructions: 'radio DJ voice, enthusiastic, professional' },
        { id: 'soulful', name: 'Soulful', instructions: 'soulful voice, warm, emotional, R&B style' },
      ],
    },
  });
});

/**
 * GET /api/voice/health
 * Check voice cloning service health
 */
voiceRoutes.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'voice-cloning',
    provider: 'grok-voice',
    capabilities: ['clone', 'multi-voice', 'vocal-samples'],
    configured: !!process.env.XAI_API_KEY,
    maxVoices: 4,
    maxTextLength: 4096,
    maxSampleTextLength: 500,
  });
});
