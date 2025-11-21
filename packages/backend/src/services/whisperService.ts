import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { TranscriptionResponse } from '@kre8/shared';

const WHISPER_API_KEY = process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY;
const WHISPER_PROVIDER = process.env.WHISPER_PROVIDER || 'openai';
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribe audio file using Whisper API
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.webm'
): Promise<TranscriptionResponse> {
  if (!WHISPER_API_KEY) {
    throw new Error('WHISPER_API_KEY or OPENAI_API_KEY not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename,
      contentType: 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be made configurable
    formData.append('response_format', 'json');

    const response = await axios.post<{ text: string }>(
      WHISPER_API_URL,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${WHISPER_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 seconds for audio processing
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return {
      text: response.data.text,
      language: 'en',
      confidence: 1.0, // Whisper doesn't return confidence, using default
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      throw new Error(`Whisper API error: ${message}`);
    }
    throw error;
  }
}

