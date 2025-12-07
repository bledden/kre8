import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { TranscriptionResponse } from '@kre8/shared';
import { withRetry } from '../utils/retry.js';
import { XAI_TTS_VOICE, getModelForTask, type TaskType } from './aiService.js';

// xAI Speech API configuration
// Read API key lazily to ensure dotenv has loaded
const getApiKey = () => process.env.XAI_API_KEY;
const XAI_STT_URL = 'https://api.x.ai/v1/audio/transcriptions';
const XAI_TTS_URL = 'https://api.x.ai/v1/audio/speech';

// Grok Voice API for voice cloning (staging endpoint from hackathon demo)
const GROK_VOICE_URL = 'https://us-east-4.api.x.ai/voice-staging/api/v1/text-to-speech/generate';
const GROK_PODCAST_URL = 'https://us-east-4.api.x.ai/voice-staging/api/v1/text-to-speech/generate-podcast';

// Available TTS voices
export const TTS_VOICES = ['Ara', 'Rex', 'Sal', 'Eve', 'Una', 'Leo'] as const;
export type TTSVoice = typeof TTS_VOICES[number];

// TTS output formats
export const TTS_FORMATS = ['mp3', 'wav', 'opus', 'flac', 'pcm'] as const;
export type TTSFormat = typeof TTS_FORMATS[number];

interface TTSOptions {
  voice?: TTSVoice;
  format?: TTSFormat;
  speed?: number; // 0.25 to 4.0, default 1.0
}

// Voice cloning options
export interface VoiceCloneOptions {
  text: string;
  voiceSample?: Buffer; // Audio sample for voice cloning
  instructions?: string; // Voice description (e.g., "young female, energetic")
  format?: 'mp3' | 'wav';
  temperature?: number;
  maxTokens?: number;
}

// Multi-voice options for layered vocals
export interface MultiVoiceOptions {
  voices: Array<{
    id: string;
    sample?: Buffer;
    instructions?: string;
  }>;
  script: Array<{
    speakerId: string;
    text: string;
  }>;
  format?: 'mp3' | 'wav';
}

// Sampling parameters for voice generation
interface VoiceSamplingParams {
  max_new_tokens: number;
  temperature: number;
  min_p: number;
  seed?: number;
  repetition_penalty?: number;
}

/**
 * Transcribe audio file using xAI's Speech-to-Text API
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.webm'
): Promise<TranscriptionResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  try {
    // Determine content type based on filename
    let contentType = 'audio/webm';
    if (filename.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (filename.endsWith('.wav')) {
      contentType = 'audio/wav';
    } else if (filename.endsWith('.m4a')) {
      contentType = 'audio/m4a';
    } else if (filename.endsWith('.ogg')) {
      contentType = 'audio/ogg';
    } else if (filename.endsWith('.flac')) {
      contentType = 'audio/flac';
    }

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename,
      contentType,
    });

    const response = await withRetry(
      () => axios.post<{ text: string }>(
        XAI_STT_URL,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 60000, // 60 seconds for audio processing
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      ),
      {
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Speech] STT retry attempt ${attempt} after ${delayMs}ms:`, error);
        },
      }
    );

    return {
      text: response.data.text,
      language: 'en',
      confidence: 1.0,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      throw new Error(`xAI STT API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Generate speech from text using xAI's Text-to-Speech API
 * Returns audio buffer in specified format
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const voice = options.voice || (XAI_TTS_VOICE as TTSVoice) || 'Eve';
  const format = options.format || 'mp3';
  const speed = options.speed || 1.0;

  // Validate voice
  if (!TTS_VOICES.includes(voice)) {
    throw new Error(`Invalid voice: ${voice}. Available: ${TTS_VOICES.join(', ')}`);
  }

  // Validate format
  if (!TTS_FORMATS.includes(format)) {
    throw new Error(`Invalid format: ${format}. Available: ${TTS_FORMATS.join(', ')}`);
  }

  // Validate speed
  if (speed < 0.25 || speed > 4.0) {
    throw new Error('Speed must be between 0.25 and 4.0');
  }

  try {
    const response = await withRetry(
      () => axios.post(
        XAI_TTS_URL,
        {
          model: 'grok-2-tts',
          input: text,
          voice,
          response_format: format,
          speed,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      ),
      {
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Speech] TTS retry attempt ${attempt} after ${delayMs}ms:`, error);
        },
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Try to parse error from arraybuffer
      let message = axiosError.message;
      if (axiosError.response?.data) {
        try {
          const errorText = Buffer.from(axiosError.response.data as ArrayBuffer).toString('utf-8');
          const errorJson = JSON.parse(errorText);
          message = errorJson.error?.message || message;
        } catch {
          // Ignore parse errors
        }
      }
      throw new Error(`xAI TTS API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Generate voice feedback for user actions
 * Uses the SIMPLE model tier for fast responses
 */
export async function generateVoiceFeedback(
  message: string,
  voice?: TTSVoice
): Promise<Buffer> {
  return textToSpeech(message, {
    voice: voice || (XAI_TTS_VOICE as TTSVoice),
    format: 'mp3',
    speed: 1.0,
  });
}

/**
 * Get content type for TTS format
 */
export function getContentTypeForFormat(format: TTSFormat): string {
  switch (format) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'opus':
      return 'audio/opus';
    case 'flac':
      return 'audio/flac';
    case 'pcm':
      return 'audio/pcm';
    default:
      return 'audio/mpeg';
  }
}

/**
 * Clone a voice from an audio sample and generate speech
 * Uses Grok Voice API for advanced voice cloning
 */
export async function cloneVoice(options: VoiceCloneOptions): Promise<Buffer> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const {
    text,
    voiceSample,
    instructions = 'audio',
    format = 'mp3',
    temperature = 1.0,
    maxTokens = 512,
  } = options;

  // Convert voice sample to base64 if provided
  const voiceBase64 = voiceSample ? voiceSample.toString('base64') : null;

  const payload = {
    model: 'grok-voice',
    input: text.slice(0, 4096), // Max 4096 chars
    response_format: format,
    instructions: instructions.slice(0, 4096),
    voice: voiceBase64 || 'None',
    sampling_params: {
      max_new_tokens: maxTokens,
      temperature,
      min_p: 0.01,
    },
  };

  try {
    console.log('[Voice] Cloning voice with Grok Voice API...');

    const response = await withRetry(
      () => axios.post(
        GROK_VOICE_URL,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 60000, // Voice generation can take time
        }
      ),
      {
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Voice] Clone retry attempt ${attempt} after ${delayMs}ms:`, error);
        },
      }
    );

    console.log('[Voice] Voice cloning successful');
    return Buffer.from(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      let message = axiosError.message;
      if (axiosError.response?.data) {
        try {
          const errorText = Buffer.from(axiosError.response.data as ArrayBuffer).toString('utf-8');
          const errorJson = JSON.parse(errorText);
          message = errorJson.error?.message || errorJson.detail || message;
        } catch {
          // Ignore parse errors
        }
      }
      throw new Error(`Grok Voice API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Generate multi-voice audio (e.g., layered vocals, harmonies)
 * Uses Grok Podcast API for multi-speaker generation
 */
export async function generateMultiVoice(options: MultiVoiceOptions): Promise<Buffer> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const { voices, script, format = 'mp3' } = options;

  // Build speakers array with voice samples
  const speakers = voices.map(voice => ({
    id: voice.id,
    audio: voice.sample ? voice.sample.toString('base64') : null,
    voice: null,
    instructions: voice.instructions || '',
  }));

  // Build script with speaker turns
  const turns = script.map(turn => ({
    speaker_id: turn.speakerId,
    text: turn.text,
  }));

  const payload = {
    model: 'grok-voice',
    speakers,
    script: turns,
    response_format: format,
    num_tts_blocks_history: 5,
    sampling_params: {
      max_new_tokens: 4096,
      temperature: 1.0,
      min_p: 0.01,
      seed: null,
      repetition_penalty: 1.0,
    },
  };

  try {
    console.log(`[Voice] Generating multi-voice audio with ${voices.length} voices...`);

    const response = await withRetry(
      () => axios.post(
        GROK_PODCAST_URL,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 120000, // Multi-voice can take longer
        }
      ),
      {
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Voice] Multi-voice retry attempt ${attempt} after ${delayMs}ms:`, error);
        },
      }
    );

    console.log('[Voice] Multi-voice generation successful');
    return Buffer.from(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      let message = axiosError.message;
      if (axiosError.response?.data) {
        try {
          const errorText = Buffer.from(axiosError.response.data as ArrayBuffer).toString('utf-8');
          const errorJson = JSON.parse(errorText);
          message = errorJson.error?.message || errorJson.detail || message;
        } catch {
          // Ignore parse errors
        }
      }
      throw new Error(`Grok Multi-Voice API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Generate a vocal sample for use in Strudel patterns
 * Returns the audio as a data URL that can be loaded as a sample
 */
export async function generateVocalSample(
  text: string,
  voiceSample?: Buffer,
  instructions?: string
): Promise<{ audioBuffer: Buffer; dataUrl: string; format: string }> {
  const audioBuffer = await cloneVoice({
    text,
    voiceSample,
    instructions,
    format: 'wav', // WAV for better sample quality
    temperature: 0.9,
    maxTokens: 1024,
  });

  // Convert to base64 data URL for browser usage
  const base64 = audioBuffer.toString('base64');
  const dataUrl = `data:audio/wav;base64,${base64}`;

  return {
    audioBuffer,
    dataUrl,
    format: 'wav',
  };
}
