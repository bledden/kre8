import { Router } from 'express';
import { storeFeedback, searchPreferences, buildPreferenceContext } from '../services/preferenceService.js';
import { FeedbackRequestSchema } from '@kre8/shared';
import { z } from 'zod';

export const feedbackRoutes = Router();

/**
 * POST /api/feedback
 * Store user feedback for a generated track
 * Uploads to xAI Collections for semantic search
 */
feedbackRoutes.post('/', async (req, res, next) => {
  try {
    const validatedRequest = FeedbackRequestSchema.parse(req.body);

    const result = await storeFeedback(validatedRequest);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to store feedback. Check server configuration.',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        feedbackId: result.feedbackId,
        message: 'Feedback stored successfully',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid feedback data',
          details: error.errors,
        },
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/feedback/search
 * Search for relevant user preferences based on a prompt
 * Returns preferences to inject into generation
 */
feedbackRoutes.post('/search', async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Query is required',
        },
      });
      return;
    }

    const searchResult = await searchPreferences(query, limit);
    const contextBlock = buildPreferenceContext(searchResult);

    res.json({
      success: true,
      data: {
        preferences: searchResult.preferences,
        summary: searchResult.summary,
        contextBlock, // Ready-to-inject context for prompts
        count: searchResult.preferences.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/feedback/health
 * Check feedback service configuration
 */
feedbackRoutes.get('/health', (req, res) => {
  const hasApiKey = !!process.env.XAI_API_KEY;
  const hasManagementKey = !!process.env.XAI_MANAGEMENT_API_KEY;
  const hasCollectionId = !!process.env.XAI_PREFERENCES_COLLECTION_ID;

  res.json({
    success: true,
    service: 'feedback-preferences',
    configured: hasApiKey && hasManagementKey && hasCollectionId,
    status: {
      apiKey: hasApiKey ? 'configured' : 'missing',
      managementKey: hasManagementKey ? 'configured' : 'missing',
      collectionId: hasCollectionId ? 'configured' : 'missing',
    },
  });
});
