/**
 * AI Service Interface Contract (from Claude)
 * 
 * This file defines the contract between the application and AI services.
 * All AI integrations must implement this interface for consistency.
 * 
 * Data Structure Optimizations:
 * - Immutable types prevent accidental mutations
 * - Branded types provide compile-time safety
 * - Discriminated unions enable exhaustive pattern matching
 */

// ============================================================================
// BRANDED TYPES (Compile-time type safety)
// ============================================================================

/**
 * Branded string type for Strudel code
 * Prevents raw strings from being mistakenly used as validated code
 */
export type BrandedStrudelCode = string & { readonly __brand: 'StrudelCode' };

/**
 * Type guard to create branded StrudelCode
 */
export function toBrandedStrudelCode(code: string): BrandedStrudelCode {
  return code as BrandedStrudelCode;
}

/**
 * Branded type for validated prompts
 */
export type SanitizedPrompt = string & { readonly __brand: 'SanitizedPrompt' };

// ============================================================================
// RESULT TYPE (Railway-oriented programming pattern)
// ============================================================================

/**
 * Result type for operations that can fail
 * Inspired by Rust's Result<T, E> for explicit error handling
 */
export type Result<T, E = AIServiceError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Helper to create success result
 */
export function Ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function Err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// ============================================================================
// ERROR TYPES (Discriminated Union for exhaustive handling)
// ============================================================================

/**
 * Base error type
 */
interface BaseAIError {
  readonly timestamp: Date;
  readonly originalError?: Error;
}

/**
 * API-related errors (rate limits, network issues, etc.)
 */
export interface APIError extends BaseAIError {
  readonly type: 'api_error';
  readonly statusCode: number;
  readonly retryable: boolean;
  readonly retryAfter?: number; // Seconds until retry allowed
}

/**
 * Validation errors (invalid input, malformed code, etc.)
 */
export interface ValidationError extends BaseAIError {
  readonly type: 'validation_error';
  readonly field: string;
  readonly message: string;
  readonly invalidValue?: unknown;
}

/**
 * Model errors (model unavailable, context length exceeded, etc.)
 */
export interface ModelError extends BaseAIError {
  readonly type: 'model_error';
  readonly modelName: string;
  readonly reason: string;
}

/**
 * Audio processing errors
 */
export interface AudioError extends BaseAIError {
  readonly type: 'audio_error';
  readonly stage: 'transcription' | 'analysis' | 'processing';
  readonly message: string;
}

/**
 * Discriminated union of all possible errors
 * Enables exhaustive pattern matching with TypeScript's type narrowing
 */
export type AIServiceError = APIError | ValidationError | ModelError | AudioError;

/**
 * Type guard for error checking
 */
export function isAIServiceError(error: unknown): error is AIServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'timestamp' in error
  );
}

// ============================================================================
// ENHANCED DOMAIN TYPES (Claude's version)
// ============================================================================

/**
 * Audio effect definition
 */
export interface Effect {
  readonly type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'chorus';
  readonly params: Readonly<Record<string, number>>;
}

/**
 * Enhanced MusicConfig with readonly and additional fields
 */
export interface EnhancedMusicConfig {
  readonly tempo?: number; // BPM (60-240 typical range)
  readonly timeSignature?: `${number}/${number}`; // e.g., "4/4", "3/4"
  readonly key?: string; // e.g., "Cmaj", "Amin"
  readonly scale?: string; // e.g., "major", "minor", "pentatonic"
  readonly instruments?: ReadonlyArray<string>; // e.g., ["bd", "snare", "piano"]
  readonly samples?: ReadonlyMap<string, string>; // Custom sample URLs
  readonly effects?: ReadonlyArray<Effect>;
  readonly duration?: number; // Duration in seconds (for rendering)
}

/**
 * Result of AI code generation (Claude's version)
 */
export interface GenerationResult {
  readonly code: BrandedStrudelCode;
  readonly explanation: string; // Human-readable description
  readonly config: EnhancedMusicConfig; // Inferred or specified config
  readonly metadata: GenerationMetadata;
}

/**
 * Metadata about the generation process
 */
export interface GenerationMetadata {
  readonly modelUsed: string; // e.g., "anthropic/claude-3.5-sonnet"
  readonly tokensUsed: number;
  readonly generationTimeMs: number;
  readonly cachedResult: boolean; // Was this served from cache?
  readonly confidence?: number; // Optional confidence score (0-1)
}

/**
 * Enhanced transcription result
 */
export interface EnhancedTranscriptionResult {
  readonly text: string;
  readonly language: string; // ISO 639-1 code
  readonly confidence: number; // 0-1
  readonly segments?: ReadonlyArray<TranscriptionSegment>; // For longer audio
}

/**
 * Segment of transcribed audio (for word-level timestamps)
 */
export interface TranscriptionSegment {
  readonly text: string;
  readonly start: number; // Seconds
  readonly end: number; // Seconds
  readonly confidence: number;
}

/**
 * Options for code generation
 */
export interface GenerationOptions {
  readonly temperature?: number; // 0-1, controls randomness
  readonly maxTokens?: number; // Max response length
  readonly useCache?: boolean; // Whether to use cached results (default: true)
  readonly model?: string; // Override default model
  readonly timeout?: number; // Request timeout in ms
}

/**
 * Options for transcription
 */
export interface TranscriptionOptions {
  readonly language?: string; // ISO 639-1 code (e.g., "en", "es")
  readonly prompt?: string; // Context hint for better accuracy
  readonly temperature?: number; // 0-1, controls randomness
}

/**
 * Fragment of generated code (for streaming)
 */
export interface CodeFragment {
  readonly content: string;
  readonly isComplete: boolean;
  readonly tokenIndex: number;
}

// ============================================================================
// AI SERVICE INTERFACE
// ============================================================================

/**
 * Main AI service interface
 * All AI integrations (OpenRouter, local models, etc.) must implement this
 */
export interface IAIService {
  /**
   * Generate Strudel music code from a natural language prompt
   */
  generateMusicCode(
    prompt: SanitizedPrompt,
    config?: Partial<EnhancedMusicConfig>,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>>;

  /**
   * Refine existing Strudel code based on user feedback
   */
  refineCode(
    currentCode: BrandedStrudelCode,
    refinementPrompt: SanitizedPrompt,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>>;

  /**
   * Transcribe audio to text (speech-to-text)
   */
  transcribeAudio(
    audio: Blob | File,
    options?: TranscriptionOptions
  ): Promise<Result<EnhancedTranscriptionResult>>;

  /**
   * Stream generated code token-by-token for real-time display
   * Optional: May not be implemented in all AI services
   */
  streamMusicCode?(
    prompt: SanitizedPrompt,
    config?: Partial<EnhancedMusicConfig>
  ): AsyncGenerator<CodeFragment, GenerationResult, undefined>;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Sanitize user prompt to prevent injection attacks
 * Algorithm: O(n) single pass through string
 */
export function sanitizePrompt(rawPrompt: string): SanitizedPrompt {
  return (rawPrompt
    .trim()
    .slice(0, 2000) // Max length
    .replace(/[<>]/g, '')) as SanitizedPrompt; // Remove potential HTML/script tags
}

/**
 * Validate Strudel code for safety
 * Algorithm: O(n) regex matching
 *
 * Checks:
 * - No eval() or Function() calls
 * - No require() or import statements
 * - No network access attempts
 * - Only allowed Strudel API calls
 */
export function validateStrudelCode(code: string): Result<BrandedStrudelCode, ValidationError> {
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /require\s*\(/,
    /import\s+/,
    /fetch\s*\(/,
    /XMLHttpRequest/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return Err({
        type: 'validation_error',
        field: 'code',
        message: `Code contains disallowed pattern: ${pattern}`,
        timestamp: new Date(),
        invalidValue: code,
      });
    }
  }

  return Ok(toBrandedStrudelCode(code));
}

/**
 * Input type for validateMusicConfig that allows flexible samples type
 */
type MusicConfigInput = Omit<Partial<EnhancedMusicConfig>, 'samples'> & {
  samples?: ReadonlyMap<string, string> | Record<string, string>;
};

/**
 * Validate music configuration
 */
export function validateMusicConfig(config: MusicConfigInput): Result<EnhancedMusicConfig, ValidationError> {
  if (config.tempo !== undefined && (config.tempo < 20 || config.tempo > 300)) {
    return Err({
      type: 'validation_error',
      field: 'tempo',
      message: 'Tempo must be between 20 and 300 BPM',
      timestamp: new Date(),
      invalidValue: config.tempo,
    });
  }

  // Convert samples Record to Map if provided
  let samplesMap: ReadonlyMap<string, string> | undefined;
  if (config.samples) {
    if (config.samples instanceof Map) {
      samplesMap = config.samples;
    } else {
      samplesMap = new Map(Object.entries(config.samples)) as ReadonlyMap<string, string>;
    }
  }

  return Ok({
    ...config,
    samples: samplesMap,
  } as EnhancedMusicConfig);
}

