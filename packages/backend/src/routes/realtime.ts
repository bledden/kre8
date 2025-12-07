import { Router } from 'express';
import { createRealtimeSession, getRealtimeConfig, REALTIME_VOICES, REALTIME_TOOLS, type RealtimeVoice } from '../services/realtimeService.js';

export const realtimeRoutes = Router();

/**
 * POST /api/realtime/session
 * Create an ephemeral session for direct client-to-xAI realtime connection
 *
 * The client will use the returned token to connect directly to:
 * wss://api.x.ai/v1/realtime
 */
realtimeRoutes.post('/session', async (req, res, next) => {
  try {
    const { voice, instructions, expiresInSeconds } = req.body;

    // Validate voice if provided
    if (voice) {
      const voiceLower = voice.toLowerCase();
      const validVoice = REALTIME_VOICES.find(v => v.toLowerCase() === voiceLower);
      if (!validVoice) {
        res.status(400).json({
          success: false,
          error: { message: `Invalid voice. Available: ${REALTIME_VOICES.join(', ')}` },
        });
        return;
      }
    }

    // Validate expiry if provided
    if (expiresInSeconds !== undefined) {
      if (typeof expiresInSeconds !== 'number' || expiresInSeconds < 60 || expiresInSeconds > 600) {
        res.status(400).json({
          success: false,
          error: { message: 'expiresInSeconds must be between 60 and 600' },
        });
        return;
      }
    }

    const session = await createRealtimeSession({
      voice: voice as RealtimeVoice,
      instructions,
      expiresInSeconds,
    });

    // Return session config for client to use
    res.json({
      success: true,
      client_secret: {
        value: session.clientSecret.value,
        expires_at: session.clientSecret.expiresAt,
      },
      voice: session.voice,
      instructions: session.instructions,
      realtime_url: session.realtimeUrl,
      tools: REALTIME_TOOLS,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/realtime/config
 * Get realtime service configuration
 */
realtimeRoutes.get('/config', (req, res) => {
  const config = getRealtimeConfig();
  res.json({
    success: true,
    data: config,
  });
});

/**
 * GET /api/realtime/health
 * Check realtime service health
 */
realtimeRoutes.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'realtime',
    provider: 'xai',
    configured: !!process.env.XAI_API_KEY,
  });
});
