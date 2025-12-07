import { Router } from 'express';
import { generateMusicCode, getModelConfig } from '../services/aiService.js';
import { gatherContext } from '../services/contextService.js';
import { GenerationRequestSchema } from '@kre8/shared';
import { z } from 'zod';

export const musicRoutes = Router();

/**
 * POST /api/music/generate
 * Generate Strudel code from natural language prompt using xAI/Grok
 * Automatically injects user context (time, location) to influence music generation
 */
musicRoutes.post('/generate', async (req, res, next) => {
  try {
    // Validate request
    const validatedRequest = GenerationRequestSchema.parse(req.body);

    // Always try to gather and inject context
    // Context injection is fast (no API calls) and improves music personalization
    let enhancedPrompt = validatedRequest.prompt;
    let contextInfo = null;

    if (validatedRequest.context) {
      try {
        const contextResult = await gatherContext({
          prompt: validatedRequest.prompt,
          location: validatedRequest.context.location,
          timezone: validatedRequest.context.timezone,
          localTime: validatedRequest.context.localTime,
        });

        // Always use enhanced prompt when context is available
        enhancedPrompt = contextResult.enhancedPrompt;

        if (contextResult.contextGathered) {
          contextInfo = {
            contextSummary: contextResult.contextSummary,
            musicalRecommendations: contextResult.musicalRecommendations,
          };
          console.log('[Music] Context applied:', contextResult.contextSummary);
        }
      } catch (contextError) {
        // Log but don't fail - fall back to original prompt
        console.warn('[Music] Context gathering failed, using original prompt:', contextError);
      }
    }

    // Generate code using live xAI API
    const result = await generateMusicCode({
      ...validatedRequest,
      prompt: enhancedPrompt,
    });

    res.json({
      success: true,
      data: result,
      context: contextInfo, // Include context info in response (optional)
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
  const hasApiKey = !!process.env.XAI_API_KEY;
  const modelConfig = getModelConfig();

  res.json({
    success: true,
    service: 'music-generation',
    provider: 'xai-grok',
    configured: hasApiKey,
    models: modelConfig,
  });
});

