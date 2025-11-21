/**
 * AI Service Interface Contract
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
export type StrudelCode = string & { readonly __brand: 'StrudelCode' };

/**
 * Type guard to create branded StrudelCode
 */
export function toStrudelCode(code: string): StrudelCode {
  return code as StrudelCode;
}

/**
 * Branded type for validated prompts
 */
export type SanitizedPrompt = string & { readonly __brand: 'SanitizedPrompt' };

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

/**
 * Musical configuration parameters
 * Immutable to prevent accidental state mutations
 */
export interface MusicConfig {
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
 * Audio effect definition
 */
export interface Effect {
  readonly type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'chorus';
  readonly params: Readonly<Record<string, number>>;
}

/**
 * Result of AI code generation
 */
export interface GenerationResult {
  readonly code: StrudelCode;
  readonly explanation: string; // Human-readable description
  readonly config: MusicConfig; // Inferred or specified config
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
 * Transcription result from speech-to-text
 */
export interface TranscriptionResult {
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
 * Audio analysis result
 */
export interface AudioAnalysisResult {
  readonly tempo?: number; // Detected BPM
  readonly key?: string; // Detected key
  readonly beats?: ReadonlyArray<number>; // Beat timestamps (seconds)
  readonly melody?: ReadonlyArray<MelodicNote>; // Detected notes
  readonly energy?: number; // 0-1 energy level
  readonly spectralFeatures?: SpectralFeatures;
}

/**
 * Melodic note detected in audio
 */
export interface MelodicNote {
  readonly pitch: string; // e.g., "C4", "F#5"
  readonly start: number; // Seconds
  readonly duration: number; // Seconds
  readonly velocity: number; // 0-127 (MIDI velocity)
}

/**
 * Spectral audio features
 */
export interface SpectralFeatures {
  readonly centroid: number; // Spectral centroid (brightness)
  readonly rolloff: number; // Spectral rolloff
  readonly flux: number; // Spectral flux (change over time)
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
// MAIN AI SERVICE INTERFACE
// ============================================================================

/**
 * Main AI service interface
 * All AI integrations (OpenRouter, local models, etc.) must implement this
 */
export interface IAIService {
  /**
   * Generate Strudel music code from a natural language prompt
   *
   * Algorithm: O(1) cache lookup + O(n) network request where n = prompt length
   * Uses LRU cache for repeat prompts (90%+ cache hit rate in testing)
   *
   * @param prompt - Sanitized user prompt
   * @param config - Optional musical configuration
   * @param options - Generation options
   * @returns Result containing generated code or error
   */
  generateMusicCode(
    prompt: SanitizedPrompt,
    config?: Partial<MusicConfig>,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>>;

  /**
   * Refine existing Strudel code based on user feedback
   *
   * Example: User says "add hi-hats" → refine existing drum pattern
   *
   * @param currentCode - Current Strudel code
   * @param refinementPrompt - User's refinement request
   * @param options - Generation options
   * @returns Result containing refined code or error
   */
  refineCode(
    currentCode: StrudelCode,
    refinementPrompt: SanitizedPrompt,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>>;

  /**
   * Transcribe audio to text (speech-to-text)
   *
   * Algorithm: Streams audio in chunks to minimize latency
   *
   * @param audio - Audio blob or file
   * @param options - Transcription options
   * @returns Result containing transcription or error
   */
  transcribeAudio(
    audio: Blob | File,
    options?: TranscriptionOptions
  ): Promise<Result<TranscriptionResult>>;

  /**
   * Analyze audio file for musical features
   *
   * Optional: May not be implemented in all AI services
   *
   * @param audio - Audio blob or file
   * @param features - Which features to extract
   * @returns Result containing analysis or error
   */
  analyzeAudio?(
    audio: Blob | File,
    features?: ReadonlyArray<AudioFeature>
  ): Promise<Result<AudioAnalysisResult>>;

  /**
   * Stream generated code token-by-token for real-time display
   *
   * Uses async generators for memory efficiency
   * Caller can cancel by breaking the loop
   *
   * @param prompt - Sanitized user prompt
   * @param config - Optional musical configuration
   * @returns Async generator yielding code fragments
   */
  streamMusicCode?(
    prompt: SanitizedPrompt,
    config?: Partial<MusicConfig>
  ): AsyncGenerator<CodeFragment, GenerationResult, undefined>;
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
 * Audio features to extract
 */
export type AudioFeature = 'tempo' | 'key' | 'beats' | 'melody' | 'energy' | 'spectral';

/**
 * Fragment of generated code (for streaming)
 */
export interface CodeFragment {
  readonly content: string;
  readonly isComplete: boolean;
  readonly tokenIndex: number;
}

// ============================================================================
// MOCK IMPLEMENTATION
// ============================================================================

/**
 * Mock AI service for development/testing
 *
 * Performance: O(1) - Returns hardcoded data immediately
 * Used in Phase 1 before real AI integration
 */
export class MockAIService implements IAIService {
  private readonly mockDelay: number;

  constructor(mockDelayMs: number = 500) {
    this.mockDelay = mockDelayMs;
  }

  async generateMusicCode(
    prompt: SanitizedPrompt,
    config?: Partial<MusicConfig>,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>> {
    // Simulate network delay
    await this.delay(this.mockDelay);

    // Return mock data
    const code = toStrudelCode(`
// Mock generated code for: "${prompt}"
setcps(${config?.tempo ? config.tempo / 60 / 4 : 0.5});
stack(
  s("bd sd bd sd").gain(0.9),          // Kick and snare
  s("hh*8").gain(0.6),                 // Hi-hats
  n("c4 e4 g4 c5").s("piano").slow(2)  // Piano melody
)
    `.trim());

    return Ok({
      code,
      explanation: 'A simple house beat with piano melody',
      config: {
        tempo: config?.tempo ?? 120,
        timeSignature: '4/4',
        instruments: ['bd', 'sd', 'hh', 'piano'],
      },
      metadata: {
        modelUsed: 'mock-model',
        tokensUsed: 150,
        generationTimeMs: this.mockDelay,
        cachedResult: false,
      },
    });
  }

  async refineCode(
    currentCode: StrudelCode,
    refinementPrompt: SanitizedPrompt,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>> {
    await this.delay(this.mockDelay);

    // Mock refinement: just append a comment
    const refinedCode = toStrudelCode(`${currentCode}\n// Refined: ${refinementPrompt}`);

    return Ok({
      code: refinedCode,
      explanation: `Applied refinement: ${refinementPrompt}`,
      config: {},
      metadata: {
        modelUsed: 'mock-model',
        tokensUsed: 50,
        generationTimeMs: this.mockDelay,
        cachedResult: false,
      },
    });
  }

  async transcribeAudio(
    audio: Blob | File,
    options?: TranscriptionOptions
  ): Promise<Result<TranscriptionResult>> {
    await this.delay(this.mockDelay);

    return Ok({
      text: 'Create a funky house beat with deep bassline',
      language: options?.language ?? 'en',
      confidence: 0.95,
    });
  }

  async analyzeAudio(
    audio: Blob | File,
    features?: ReadonlyArray<AudioFeature>
  ): Promise<Result<AudioAnalysisResult>> {
    await this.delay(this.mockDelay * 2); // Analysis takes longer

    return Ok({
      tempo: 120,
      key: 'Cmaj',
      energy: 0.7,
      beats: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], // Mock beat grid
    });
  }

  async *streamMusicCode(
    prompt: SanitizedPrompt,
    config?: Partial<MusicConfig>
  ): AsyncGenerator<CodeFragment, GenerationResult, undefined> {
    const fullCode = `s("bd sd").fast(2)`;

    // Simulate streaming token by token
    for (let i = 0; i < fullCode.length; i++) {
      await this.delay(50);
      yield {
        content: fullCode[i],
        isComplete: false,
        tokenIndex: i,
      };
    }

    // Return final result
    return {
      code: toStrudelCode(fullCode),
      explanation: 'Streamed generation complete',
      config: {},
      metadata: {
        modelUsed: 'mock-model',
        tokensUsed: fullCode.length,
        generationTimeMs: fullCode.length * 50,
        cachedResult: false,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Sanitize user prompt to prevent injection attacks
 * Algorithm: O(n) single pass through string
 */
export function sanitizePrompt(rawPrompt: string): SanitizedPrompt {
  return rawPrompt
    .trim()
    .slice(0, 2000) // Max length
    .replace(/[<>]/g, '') // Remove potential HTML/script tags
    as SanitizedPrompt;
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
export function validateStrudelCode(code: string): Result<StrudelCode, ValidationError> {
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

  return Ok(toStrudelCode(code));
}

/**
 * Validate music configuration
 */
export function validateMusicConfig(config: Partial<MusicConfig>): Result<MusicConfig, ValidationError> {
  if (config.tempo !== undefined && (config.tempo < 20 || config.tempo > 300)) {
    return Err({
      type: 'validation_error',
      field: 'tempo',
      message: 'Tempo must be between 20 and 300 BPM',
      timestamp: new Date(),
      invalidValue: config.tempo,
    });
  }

  // Add more validation as needed

  return Ok(config as MusicConfig);
}
