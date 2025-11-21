/**
 * Backend wrapper for MockAIService
 * Allows switching between mock and real AI services via environment variable
 */

import { MockAIService } from '@kre8/shared';
import { sanitizePrompt, legacyToEnhancedConfig } from '@kre8/shared';
import { GenerationRequest, StrudelCode } from '@kre8/shared';
import { legacyToGenerationResult, generationResultToLegacy } from '@kre8/shared';

/**
 * Generate music code using mock service (for development/testing)
 */
export async function generateMusicCodeMock(
  request: GenerationRequest
): Promise<StrudelCode> {
  const mockService = new MockAIService(500); // 500ms delay
  
  const sanitized = sanitizePrompt(request.prompt);
  const config = legacyToEnhancedConfig(request.config);
  
  const result = await mockService.generateMusicCode(sanitized, config);
  
  if (!result.success) {
    const errorMsg = result.error.type === 'validation_error' 
      ? result.error.message 
      : result.error.type === 'api_error'
      ? `API error: ${result.error.statusCode}`
      : 'Mock generation failed';
    throw new Error(errorMsg);
  }
  
  // Convert back to legacy format for compatibility
  return generationResultToLegacy(result.data);
}

