/**
 * Shared package exports
 */

// Legacy types (for backward compatibility)
export * from './types';
export * from './schemas';

// New AI contracts (Claude's type system)
export * from './ai-contracts';

// Mock service
export { MockAIService } from './mock-ai-service';

// Adapters
export * from './adapters';

