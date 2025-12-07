/**
 * Input validation utilities
 * Provides type-safe validation guards for API inputs
 */

import { VALIDATION_CONFIG } from '../constants/index.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validate that a value is within a numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate music generation request prompt
 */
export function validatePrompt(prompt: unknown): ValidationResult {
  if (!isNonEmptyString(prompt)) {
    return { valid: false, error: 'Prompt must be a non-empty string' };
  }

  if (prompt.length < VALIDATION_CONFIG.MIN_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt must be at least ${VALIDATION_CONFIG.MIN_PROMPT_LENGTH} character(s)` };
  }

  if (prompt.length > VALIDATION_CONFIG.MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt must not exceed ${VALIDATION_CONFIG.MAX_PROMPT_LENGTH} characters` };
  }

  return { valid: true };
}

/**
 * Validate tempo value
 */
export function validateTempo(tempo: unknown): ValidationResult {
  if (tempo === undefined || tempo === null) {
    return { valid: true }; // Optional field
  }

  if (!isPositiveNumber(tempo)) {
    return { valid: false, error: 'Tempo must be a positive number' };
  }

  if (!isInRange(tempo, VALIDATION_CONFIG.MIN_TEMPO, VALIDATION_CONFIG.MAX_TEMPO)) {
    return {
      valid: false,
      error: `Tempo must be between ${VALIDATION_CONFIG.MIN_TEMPO} and ${VALIDATION_CONFIG.MAX_TEMPO} BPM`
    };
  }

  return { valid: true };
}

/**
 * Validate tweet text for X posts
 */
export function validateTweetText(text: unknown): ValidationResult {
  if (!isNonEmptyString(text)) {
    return { valid: false, error: 'Tweet text must be a non-empty string' };
  }

  if (text.length > VALIDATION_CONFIG.MAX_TWEET_LENGTH) {
    return {
      valid: false,
      error: `Tweet must not exceed ${VALIDATION_CONFIG.MAX_TWEET_LENGTH} characters`
    };
  }

  return { valid: true };
}

/**
 * Validate generation request configuration
 */
export function validateGenerationConfig(config: unknown): ValidationResult {
  if (config === undefined || config === null) {
    return { valid: true }; // Optional field
  }

  if (typeof config !== 'object') {
    return { valid: false, error: 'Config must be an object' };
  }

  const cfg = config as Record<string, unknown>;

  // Validate tempo if present
  if ('tempo' in cfg) {
    const tempoResult = validateTempo(cfg.tempo);
    if (!tempoResult.valid) {
      return tempoResult;
    }
  }

  return { valid: true };
}

/**
 * Sanitize string input by trimming whitespace
 */
export function sanitizeString(input: string): string {
  return input.trim();
}

/**
 * Validate and sanitize a complete generation request
 */
export function validateGenerationRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const request = body as Record<string, unknown>;

  // Validate prompt
  const promptResult = validatePrompt(request.prompt);
  if (!promptResult.valid) {
    return promptResult;
  }

  // Validate config if present
  const configResult = validateGenerationConfig(request.config);
  if (!configResult.valid) {
    return configResult;
  }

  return { valid: true };
}
