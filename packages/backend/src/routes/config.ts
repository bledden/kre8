import { Router } from 'express';
import {
  loadDefaults,
  loadModels,
  loadFewShotExamples,
} from '../services/configLoader.js';

export const configRoutes = Router();

/**
 * GET /api/config/defaults
 * Get default music configuration
 */
configRoutes.get('/defaults', (req, res) => {
  try {
    const defaults = loadDefaults();
    res.json({
      success: true,
      data: defaults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load defaults' },
    });
  }
});

/**
 * GET /api/config/models
 * Get available AI models
 */
configRoutes.get('/models', (req, res) => {
  try {
    const models = loadModels();
    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load models' },
    });
  }
});

/**
 * GET /api/config/examples
 * Get few-shot examples
 */
configRoutes.get('/examples', (req, res) => {
  try {
    const examples = loadFewShotExamples();
    res.json({
      success: true,
      data: examples,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load examples' },
    });
  }
});

