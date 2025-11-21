/**
 * Mock AI Service for development/testing
 * 
 * Performance: O(1) - Returns hardcoded data immediately
 * Useful for testing without API keys or for development
 */

import {
  IAIService,
  SanitizedPrompt,
  BrandedStrudelCode,
  EnhancedMusicConfig,
  GenerationResult,
  EnhancedTranscriptionResult,
  GenerationOptions,
  TranscriptionOptions,
  CodeFragment,
  GenerationMetadata,
  Result,
  Ok,
  toBrandedStrudelCode,
} from './ai-contracts';

export class MockAIService implements IAIService {
  private readonly mockDelay: number;

  constructor(mockDelayMs: number = 500) {
    this.mockDelay = mockDelayMs;
  }

  async generateMusicCode(
    prompt: SanitizedPrompt,
    config?: Partial<EnhancedMusicConfig>,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>> {
    // Simulate network delay
    await this.delay(this.mockDelay);

    // Return mock data
    const code = toBrandedStrudelCode(`
// Mock generated code for: "${prompt}"
setcps(${config?.tempo ? config.tempo / 60 / 4 : 0.5});
stack(
  s("bd sd bd sd").gain(0.9),          // Kick and snare
  s("hh*8").gain(0.6),                 // Hi-hats
  n("c4 e4 g4 c5").s("piano").slow(2)  // Piano melody
)
    `.trim());

    const metadata: GenerationMetadata = {
      modelUsed: 'mock-model',
      tokensUsed: 150,
      generationTimeMs: this.mockDelay,
      cachedResult: false,
    };

    return Ok({
      code,
      explanation: 'A simple house beat with piano melody',
      config: {
        tempo: config?.tempo ?? 120,
        timeSignature: '4/4',
        instruments: ['bd', 'sd', 'hh', 'piano'],
      },
      metadata,
    });
  }

  async refineCode(
    currentCode: BrandedStrudelCode,
    refinementPrompt: SanitizedPrompt,
    options?: GenerationOptions
  ): Promise<Result<GenerationResult>> {
    await this.delay(this.mockDelay);

    // Mock refinement: append refinement as comment
    const refinedCode = toBrandedStrudelCode(`${currentCode}\n// Refined: ${refinementPrompt}`);

    const metadata: GenerationMetadata = {
      modelUsed: 'mock-model',
      tokensUsed: 50,
      generationTimeMs: this.mockDelay,
      cachedResult: false,
    };

    return Ok({
      code: refinedCode,
      explanation: `Applied refinement: ${refinementPrompt}`,
      config: {},
      metadata,
    });
  }

  async transcribeAudio(
    audio: Blob | File,
    options?: TranscriptionOptions
  ): Promise<Result<EnhancedTranscriptionResult>> {
    await this.delay(this.mockDelay);

    return Ok({
      text: 'Create a funky house beat with deep bassline',
      language: options?.language ?? 'en',
      confidence: 0.95,
    });
  }

  async *streamMusicCode(
    prompt: SanitizedPrompt,
    config?: Partial<EnhancedMusicConfig>
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
    const metadata: GenerationMetadata = {
      modelUsed: 'mock-model',
      tokensUsed: fullCode.length,
      generationTimeMs: fullCode.length * 50,
      cachedResult: false,
    };

    return {
      code: toBrandedStrudelCode(fullCode),
      explanation: 'Streamed generation complete',
      config: {},
      metadata,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

