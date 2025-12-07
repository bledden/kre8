/**
 * xAI Realtime Voice API Service
 * Provides ephemeral tokens for direct client-to-xAI WebSocket connections
 *
 * API: wss://api.x.ai/v1/realtime
 * Docs: https://docs.x.ai/docs/guides/realtime-voice
 */

import axios, { AxiosError } from 'axios';
import { withRetry } from '../utils/retry.js';
import { XAI_TTS_VOICE } from './aiService.js';

// xAI Realtime API configuration
// Read API key lazily to ensure dotenv has loaded
const getApiKey = () => process.env.XAI_API_KEY;
const XAI_CLIENT_SECRETS_URL = 'https://api.x.ai/v1/realtime/client_secrets';

// Session configuration
const DEFAULT_SESSION_EXPIRY_SECONDS = 300; // 5 minutes

// Available voices for realtime (same as TTS)
export const REALTIME_VOICES = ['Ara', 'Rex', 'Sal', 'Eve', 'Una', 'Leo'] as const;
export type RealtimeVoice = typeof REALTIME_VOICES[number];

export interface RealtimeSessionConfig {
  voice?: RealtimeVoice;
  instructions?: string;
  expiresInSeconds?: number;
}

export interface RealtimeSession {
  clientSecret: {
    value: string;
    expiresAt: number;
  };
  voice: string;
  instructions: string;
  realtimeUrl: string;
}

// Default instructions for the Kre8 music DJ assistant
const DEFAULT_INSTRUCTIONS = `You are Kre8, an AI music DJ and creative assistant. You help users create music through natural conversation.

Your personality:
- Energetic and encouraging, like a friendly DJ
- Brief and punchy - you're speaking out loud, keep it to 1-2 sentences
- Use music slang naturally ("that beat slaps", "fire", "let's drop it")

When the user asks for music:
1. Acknowledge their request with enthusiasm (quick!)
2. Call the generate_strudel tool with their requirements
3. Briefly describe what you're creating

Musical capabilities - when calling generate_strudel, you can request:
- Genres: lo-fi, techno, house, trap, ambient, drum-and-bass, jazz, classical, game music
- Moods: chill, energetic, dark, uplifting, mysterious, aggressive
- Tempos: 60-180 BPM (slow ambient ~60, lo-fi ~85, house ~120, techno ~130, dnb ~174)

You can use web_search to find trending music styles.
You can use x_search to see what's hot on X/Twitter right now.

Keep ALL responses SHORT. You're a DJ, not a lecturer!`;

// Tools available in the realtime session
export const REALTIME_TOOLS = [
  { type: 'web_search' as const },
  { type: 'x_search' as const },
  {
    type: 'function' as const,
    name: 'generate_strudel',
    description: 'Generate Strudel live-coding music from a description. Call this when the user wants to create, make, or play music.',
    parameters: {
      type: 'object',
      properties: {
        genre: {
          type: 'string',
          description: 'Music genre (e.g., lo-fi, techno, trap, house, ambient, jazz, classical, game)',
        },
        mood: {
          type: 'string',
          description: 'Mood or feeling (e.g., chill, energetic, dark, uplifting, mysterious)',
        },
        bpm: {
          type: 'number',
          description: 'Beats per minute (60-180). Omit to let the system choose based on genre.',
        },
        description: {
          type: 'string',
          description: 'Additional description or details about the music',
        },
      },
      required: ['genre'],
    },
  },
];

/**
 * Create an ephemeral session for direct client-to-xAI realtime connection
 * The client will connect directly to wss://api.x.ai/v1/realtime using this token
 */
export async function createRealtimeSession(
  config: RealtimeSessionConfig = {}
): Promise<RealtimeSession> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const voice = config.voice || (XAI_TTS_VOICE as RealtimeVoice) || 'Eve';
  const instructions = config.instructions || DEFAULT_INSTRUCTIONS;
  const expiresInSeconds = config.expiresInSeconds || DEFAULT_SESSION_EXPIRY_SECONDS;

  // Validate voice
  const voiceLower = voice.toLowerCase();
  const validVoice = REALTIME_VOICES.find(v => v.toLowerCase() === voiceLower);
  if (!validVoice) {
    throw new Error(`Invalid voice: ${voice}. Available: ${REALTIME_VOICES.join(', ')}`);
  }

  try {
    const response = await withRetry(
      () => axios.post<{ value: string; expires_at: number }>(
        XAI_CLIENT_SECRETS_URL,
        {
          expires_after: { seconds: expiresInSeconds }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ),
      {
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Realtime] Token request retry ${attempt} after ${delayMs}ms:`, error);
        },
      }
    );

    return {
      clientSecret: {
        value: response.data.value,
        expiresAt: response.data.expires_at,
      },
      voice: validVoice.toLowerCase(),
      instructions,
      realtimeUrl: 'wss://api.x.ai/v1/realtime',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      throw new Error(`xAI Realtime API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Get realtime service configuration info
 */
export function getRealtimeConfig() {
  return {
    voices: REALTIME_VOICES,
    defaultVoice: XAI_TTS_VOICE || 'Eve',
    realtimeUrl: 'wss://api.x.ai/v1/realtime',
    sessionDurationSeconds: DEFAULT_SESSION_EXPIRY_SECONDS,
    configured: !!getApiKey(),
  };
}
