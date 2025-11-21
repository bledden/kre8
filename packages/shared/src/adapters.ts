/**
 * Adapters to convert between different type systems
 * 
 * Bridges between:
 * - Legacy types (StrudelCode object) and new types (BrandedStrudelCode string)
 * - Try/catch error handling and Result<T, E> pattern
 */

import {
  StrudelCode as LegacyStrudelCode,
  MusicConfig as LegacyMusicConfig,
  TranscriptionResponse as LegacyTranscriptionResponse,
} from './types';

import {
  BrandedStrudelCode,
  GenerationResult,
  EnhancedMusicConfig,
  EnhancedTranscriptionResult,
  Result,
  Ok,
  Err,
  ValidationError,
  toBrandedStrudelCode,
} from './ai-contracts';

/**
 * Convert legacy StrudelCode object to branded string
 */
export function legacyToBrandedCode(legacy: LegacyStrudelCode): BrandedStrudelCode {
  return toBrandedStrudelCode(legacy.code);
}

/**
 * Convert branded string to legacy StrudelCode object
 */
export function brandedToLegacyCode(
  branded: BrandedStrudelCode,
  explanation?: string,
  config?: GenerationResult['config']
): LegacyStrudelCode {
  return {
    code: branded,
    explanation,
    metadata: config ? {
      tempo: config.tempo,
      instruments: config.instruments as string[],
    } : undefined,
  };
}

/**
 * Convert legacy MusicConfig to enhanced version
 */
export function legacyToEnhancedConfig(legacy?: LegacyMusicConfig): Partial<EnhancedMusicConfig> {
  if (!legacy) return {};

  const samplesMap = legacy.samples 
    ? new Map(Object.entries(legacy.samples)) as ReadonlyMap<string, string>
    : undefined;

  return {
    tempo: legacy.tempo,
    key: legacy.key,
    scale: legacy.scale,
    samples: samplesMap,
  };
}

/**
 * Convert enhanced MusicConfig to legacy version
 */
export function enhancedToLegacyConfig(enhanced?: Partial<EnhancedMusicConfig>): LegacyMusicConfig | undefined {
  if (!enhanced) return undefined;

  const samples = enhanced.samples instanceof Map
    ? Object.fromEntries(enhanced.samples)
    : undefined;

  return {
    tempo: enhanced.tempo,
    key: enhanced.key,
    scale: enhanced.scale,
    samples,
    style: undefined, // Not in enhanced version
  };
}

/**
 * Convert GenerationResult to legacy StrudelCode
 */
export function generationResultToLegacy(result: GenerationResult): LegacyStrudelCode {
  return brandedToLegacyCode(
    result.code,
    result.explanation,
    result.config
  );
}

/**
 * Convert legacy StrudelCode to GenerationResult
 */
export function legacyToGenerationResult(
  legacy: LegacyStrudelCode,
  modelUsed: string = 'unknown',
  tokensUsed: number = 0,
  generationTimeMs: number = 0
): GenerationResult {
  const config = legacyToEnhancedConfig({
    tempo: legacy.metadata?.tempo,
    instruments: legacy.metadata?.instruments,
  } as LegacyMusicConfig);
  
  return {
    code: legacyToBrandedCode(legacy),
    explanation: legacy.explanation || 'Generated Strudel pattern',
    config: config || {},
    metadata: {
      modelUsed,
      tokensUsed,
      generationTimeMs,
      cachedResult: false,
    },
  };
}

/**
 * Convert legacy TranscriptionResponse to enhanced version
 */
export function legacyToEnhancedTranscription(legacy: LegacyTranscriptionResponse): EnhancedTranscriptionResult {
  return {
    text: legacy.text,
    language: legacy.language || 'en',
    confidence: legacy.confidence || 0.95,
  };
}

/**
 * Convert enhanced TranscriptionResult to legacy version
 */
export function enhancedToLegacyTranscription(enhanced: EnhancedTranscriptionResult): LegacyTranscriptionResponse {
  return {
    text: enhanced.text,
    language: enhanced.language,
    confidence: enhanced.confidence,
  };
}

/**
 * Wrap a promise that throws into a Result type
 */
export async function wrapResult<T>(
  promise: Promise<T>
): Promise<Result<T, ValidationError>> {
  try {
    const data = await promise;
    return Ok(data);
  } catch (error) {
    return Err({
      type: 'validation_error',
      field: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      originalError: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * Unwrap a Result type, throwing on error (for backward compatibility)
 */
export function unwrapResult<T>(result: Result<T, any>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error.message || 'Operation failed');
}

