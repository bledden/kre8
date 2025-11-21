import { Router } from 'express';
import { generateMusicCode } from '../services/aiService.js';
import { generateMusicCodeMock } from '../services/mockAIService.js';
import { GenerationRequestSchema } from '@kre8/shared';
import { z } from 'zod';

export const musicRoutes = Router();

// Allow switching between mock and real AI via environment variable
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';

/**
 * POST /api/music/generate
 * Generate Strudel code from natural language prompt
 */
musicRoutes.post('/generate', async (req, res, next) => {
  try {
    // Validate request
    const validatedRequest = GenerationRequestSchema.parse(req.body);

    // Generate code (mock or real based on environment)
    const result = USE_MOCK_AI
      ? await generateMusicCodeMock(validatedRequest)
      : await generateMusicCode(validatedRequest);

    res.json({
      success: true,
      data: result,
      mock: USE_MOCK_AI, // Indicate if mock was used
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/music/health
 * Check music generation service health
 */
musicRoutes.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'music-generation',
    mode: USE_MOCK_AI ? 'mock' : 'real',
    configured: USE_MOCK_AI || !!process.env.OPENROUTER_API_KEY,
  });
});

