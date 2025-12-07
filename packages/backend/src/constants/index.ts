/**
 * Application-wide constants
 * Extracted from magic numbers throughout the codebase
 */

// =============================================================================
// AI Service Constants
// =============================================================================

export const AI_CONFIG = {
  /** Default temperature for creative generation (0-1 scale) */
  DEFAULT_TEMPERATURE: 0.7,

  /** Maximum tokens for response (increased for reasoning models) */
  MAX_TOKENS: 4000,

  /** API request timeout in milliseconds (90 seconds for reasoning models) */
  REQUEST_TIMEOUT_MS: 90000,

  /** Number of conversation history messages to include for context */
  CONVERSATION_HISTORY_LIMIT: 5,
} as const;

// =============================================================================
// Music/Audio Constants
// =============================================================================

export const MUSIC_CONFIG = {
  /** Conversion factor from CPS (cycles per second) to CPM/BPM */
  CPS_TO_CPM_FACTOR: 60,

  /** Default tempo in BPM */
  DEFAULT_TEMPO: 120,
} as const;

// =============================================================================
// Cache Configuration
// =============================================================================

export const CACHE_CONFIG: {
  CONFIG_CACHE_MAX_SIZE: number;
  CONFIG_CACHE_TTL_MS: number;
  PROMPT_CACHE_MAX_SIZE: number;
  PROMPT_CACHE_TTL_MS: number;
  DEFAULT_MAX_SIZE: number;
  DEFAULT_TTL_MS: number;
} = {
  /** Maximum entries for config cache */
  CONFIG_CACHE_MAX_SIZE: 50,

  /** TTL for config cache in milliseconds (10 minutes) */
  CONFIG_CACHE_TTL_MS: 10 * 60 * 1000,

  /** Maximum entries for prompt cache */
  PROMPT_CACHE_MAX_SIZE: 20,

  /** TTL for prompt cache in milliseconds (10 minutes) */
  PROMPT_CACHE_TTL_MS: 10 * 60 * 1000,

  /** Default cache max size */
  DEFAULT_MAX_SIZE: 100,

  /** Default cache TTL in milliseconds (5 minutes) */
  DEFAULT_TTL_MS: 5 * 60 * 1000,
};

// =============================================================================
// Rate Limiting
// =============================================================================

export const RATE_LIMIT_CONFIG = {
  /** Default request limit */
  DEFAULT_REQUESTS: 10,

  /** Default window in milliseconds (1 minute) */
  DEFAULT_WINDOW_MS: 60000,
} as const;

// =============================================================================
// Retry Configuration
// =============================================================================

export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,

  /** Initial delay between retries in milliseconds */
  INITIAL_DELAY_MS: 1000,

  /** Maximum delay between retries in milliseconds */
  MAX_DELAY_MS: 10000,

  /** Backoff multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
} as const;

// =============================================================================
// Input Validation
// =============================================================================

export const VALIDATION_CONFIG = {
  /** Maximum prompt length in characters */
  MAX_PROMPT_LENGTH: 10000,

  /** Minimum prompt length in characters */
  MIN_PROMPT_LENGTH: 1,

  /** Maximum tempo in BPM */
  MAX_TEMPO: 300,

  /** Minimum tempo in BPM */
  MIN_TEMPO: 20,

  /** Maximum tweet length for X posts */
  MAX_TWEET_LENGTH: 280,
} as const;
