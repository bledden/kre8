/**
 * Zod validation schemas for runtime type checking
 */
import { z } from 'zod';

// Validation constants (duplicated from backend to avoid circular deps)
const VALIDATION = {
  MAX_PROMPT_LENGTH: 10000,
  MIN_TEMPO: 20,
  MAX_TEMPO: 300,
  MAX_TWEET_LENGTH: 280,
} as const;

export const StrudelCodeSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  explanation: z.string().optional(),
  metadata: z.object({
    tempo: z.number().positive().optional(),
    instruments: z.array(z.string()).optional(),
    duration: z.number().positive().optional(),
  }).optional(),
});

export const GenerationModeSchema = z.enum(['auto', 'loop', 'arrangement', 'layer']);

export const MusicConfigSchema = z.object({
  tempo: z.number()
    .min(VALIDATION.MIN_TEMPO, `Tempo must be at least ${VALIDATION.MIN_TEMPO} BPM`)
    .max(VALIDATION.MAX_TEMPO, `Tempo cannot exceed ${VALIDATION.MAX_TEMPO} BPM`)
    .optional(),
  scale: z.string().optional(),
  key: z.string().optional(),
  samples: z.record(z.string()).optional(),
  style: z.string().optional(),
  mode: GenerationModeSchema.optional(),
});

export const LayerSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  muted: z.boolean(),
});

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const UserContextSchema = z.object({
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }).optional(),
  timezone: z.string().optional(),
  localTime: z.string().optional(),
});

export const GenerationRequestSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt cannot be empty')
    .max(VALIDATION.MAX_PROMPT_LENGTH, `Prompt cannot exceed ${VALIDATION.MAX_PROMPT_LENGTH} characters`),
  config: MusicConfigSchema.optional(),
  conversationHistory: z.array(MessageSchema).optional(),
  refinement: z.boolean().optional(),
  context: UserContextSchema.optional(),
  existingLayers: z.array(LayerSchema).optional(),
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

// Feedback Schemas
export const FeedbackRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const FeedbackRequestSchema = z.object({
  rating: FeedbackRatingSchema,
  textFeedback: z.string().max(2000).optional(),
  prompt: z.string().min(1),
  code: z.string().min(1),
  metadata: z.object({
    tempo: z.number().positive().optional(),
    genre: z.string().optional(),
    instruments: z.array(z.string()).optional(),
    listenDurationMs: z.number().nonnegative().optional(),
  }).optional(),
});

export const UserFeedbackSchema = z.object({
  id: z.string(),
  rating: FeedbackRatingSchema,
  textFeedback: z.string().optional(),
  prompt: z.string(),
  code: z.string(),
  metadata: z.object({
    tempo: z.number().optional(),
    genre: z.string().optional(),
    instruments: z.array(z.string()).optional(),
    listenDurationMs: z.number().optional(),
  }),
  createdAt: z.date(),
});

