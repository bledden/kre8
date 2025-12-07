/**
 * Retry utility with exponential backoff
 * Provides resilient API calls for transient failures
 */

import { RETRY_CONFIG } from '../constants/index.js';

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for retry events (for logging) */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Default function to determine if an error is retryable
 * Retries on network errors and 5xx server errors
 */
function defaultIsRetryable(error: unknown): boolean {
  // Network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    ) {
      return true;
    }
  }

  // Axios-style errors with response status
  const axiosError = error as { response?: { status?: number } };
  if (axiosError.response?.status) {
    const status = axiosError.response.status;
    // Retry on server errors (5xx) and rate limiting (429)
    return status >= 500 || status === 429;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  // Exponential backoff: delay = initial * (multiplier ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    initialDelayMs = RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelayMs = RETRY_CONFIG.MAX_DELAY_MS,
    backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier
      );

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, error, delayMs);
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}
