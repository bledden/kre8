/**
 * Zod validation schemas for runtime type checking
 */
import { z } from 'zod';

export const StrudelCodeSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  explanation: z.string().optional(),
  metadata: z.object({
    tempo: z.number().positive().optional(),
    instruments: z.array(z.string()).optional(),
    duration: z.number().positive().optional(),
  }).optional(),
});

export const MusicConfigSchema = z.object({
  tempo: z.number().positive().optional(),
  scale: z.string().optional(),
  key: z.string().optional(),
  samples: z.record(z.string()).optional(),
  style: z.string().optional(),
});

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const GenerationRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  config: MusicConfigSchema.optional(),
  conversationHistory: z.array(MessageSchema).optional(),
  refinement: z.boolean().optional(),
});

export const AIServiceResponseSchema = z.object({
  code: z.string(),
  explanation: z.string().optional(),
  model: z.string().optional(),
  tokensUsed: z.number().optional(),
  finishReason: z.string().optional(),
});

export const TranscriptionResponseSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

