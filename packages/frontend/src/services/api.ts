import axios from 'axios';
import {
  GenerationRequest,
  StrudelCode,
  TranscriptionResponse,
  FeedbackRequest,
  FeedbackRating,
  PreferenceSearchResult,
} from '@kre8/shared';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const musicApi = {
  /**
   * Generate Strudel code from prompt
   */
  async generate(request: GenerationRequest): Promise<StrudelCode> {
    const response = await api.post<{ success: boolean; data: StrudelCode }>(
      '/music/generate',
      request
    );
    return response.data.data;
  },
};

export const transcriptionApi = {
  /**
   * Transcribe audio file to text
   */
  async transcribe(audioBlob: Blob): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await api.post<{ success: boolean; data: TranscriptionResponse }>(
      '/transcription/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
};

export const configApi = {
  /**
   * Get default configuration
   */
  async getDefaults() {
    const response = await api.get('/config/defaults');
    return response.data.data;
  },

  /**
   * Get available models
   */
  async getModels() {
    const response = await api.get('/config/models');
    return response.data.data;
  },
};

// =============================================================================
// X Platform API
// =============================================================================

export interface XAuthConfig {
  configured: boolean;
  callbackUrl: string;
  bearerTokenConfigured: boolean;
}

export interface XTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  username: string;
}

export interface TweetResult {
  tweetId: string;
  tweetUrl: string;
}

export interface MediaUploadResult {
  mediaId: string;
}

export const xApi = {
  /**
   * Check X OAuth configuration status
   */
  async getConfig(): Promise<XAuthConfig> {
    const response = await api.get<{ success: boolean; data: XAuthConfig }>('/x/config');
    return response.data.data;
  },

  /**
   * Get authorization URL to start OAuth flow
   */
  async getAuthUrl(): Promise<string> {
    const response = await api.get<{ success: boolean; data: { authUrl: string } }>('/x/auth');
    return response.data.data.authUrl;
  },

  /**
   * Upload media (audio/video) for attachment to a tweet
   */
  async uploadMedia(accessToken: string, mediaBlob: Blob, mediaType: string = 'audio/wav'): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('media', mediaBlob, mediaType === 'audio/wav' ? 'beat.wav' : 'beat.mp4');
    formData.append('accessToken', accessToken);
    formData.append('mediaType', mediaType);

    const response = await api.post<{ success: boolean; data: MediaUploadResult }>(
      '/x/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Post a tweet on behalf of the authenticated user
   */
  async postTweet(accessToken: string, text: string, mediaId?: string): Promise<TweetResult> {
    const response = await api.post<{ success: boolean; data: TweetResult }>(
      '/x/tweet',
      { accessToken, text, mediaId }
    );
    return response.data.data;
  },

  /**
   * Refresh an expired access token
   */
  async refreshToken(refreshToken: string): Promise<XTokens> {
    const response = await api.post<{ success: boolean; data: XTokens }>(
      '/x/refresh',
      { refreshToken }
    );
    return response.data.data;
  },

  /**
   * Search recent tweets
   */
  async searchTweets(query: string, maxResults: number = 10) {
    const response = await api.get<{ success: boolean; data: { tweets: Array<{ id: string; text: string; author_id: string }> } }>(
      `/x/search?q=${encodeURIComponent(query)}&max_results=${maxResults}`
    );
    return response.data.data.tweets;
  },
};

// =============================================================================
// Voice Cloning API
// =============================================================================

export interface VoicePreset {
  id: string;
  name: string;
  instructions: string;
}

export interface VocalSampleResult {
  dataUrl: string;
  format: string;
  size: number;
}

export interface VoiceHealthStatus {
  success: boolean;
  service: string;
  provider: string;
  capabilities: string[];
  configured: boolean;
  maxVoices: number;
  maxTextLength: number;
  maxSampleTextLength: number;
}

export const voiceApi = {
  /**
   * Clone a voice and generate speech
   * @param text - Text to speak
   * @param voiceSample - Optional audio sample for voice cloning
   * @param instructions - Voice description if no sample provided
   * @param consentConfirmed - Must be true if voiceSample is provided
   */
  async cloneVoice(
    text: string,
    voiceSample?: Blob,
    instructions?: string,
    consentConfirmed: boolean = false
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('text', text);
    if (voiceSample) {
      formData.append('voiceSample', voiceSample, 'voice.wav');
    }
    if (instructions) {
      formData.append('instructions', instructions);
    }
    formData.append('consentConfirmed', String(consentConfirmed));
    formData.append('format', 'wav');

    const response = await api.post('/voice/clone', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generate a vocal sample for use in Strudel patterns
   * Returns a data URL that can be loaded as a sample
   */
  async generateVocalSample(
    text: string,
    voiceSample?: Blob,
    instructions?: string,
    consentConfirmed: boolean = false
  ): Promise<VocalSampleResult> {
    const formData = new FormData();
    formData.append('text', text);
    if (voiceSample) {
      formData.append('voiceSample', voiceSample, 'voice.wav');
    }
    if (instructions) {
      formData.append('instructions', instructions);
    }
    formData.append('consentConfirmed', String(consentConfirmed));

    const response = await api.post<{ success: boolean; data: VocalSampleResult }>(
      '/voice/sample',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  /**
   * Generate multi-voice audio (layered vocals)
   */
  async generateMultiVoice(
    voices: Array<{ id: string; sample?: Blob; instructions?: string }>,
    script: Array<{ speakerId: string; text: string }>,
    consentConfirmed: boolean = false
  ): Promise<Blob> {
    const formData = new FormData();

    // Add voice samples
    voices.forEach((voice, index) => {
      if (voice.sample) {
        formData.append('voiceSamples', voice.sample, `voice${index}.wav`);
      }
    });

    // Add voice definitions (without samples)
    const voiceDefinitions = voices.map(v => ({
      id: v.id,
      instructions: v.instructions,
    }));
    formData.append('voices', JSON.stringify(voiceDefinitions));
    formData.append('script', JSON.stringify(script));
    formData.append('consentConfirmed', String(consentConfirmed));
    formData.append('format', 'wav');

    const response = await api.post('/voice/multi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get preset voice descriptions
   */
  async getPresets(): Promise<VoicePreset[]> {
    const response = await api.get<{ success: boolean; data: { presets: VoicePreset[] } }>(
      '/voice/presets'
    );
    return response.data.data.presets;
  },

  /**
   * Check voice service health
   */
  async getHealth(): Promise<VoiceHealthStatus> {
    const response = await api.get<VoiceHealthStatus>('/voice/health');
    return response.data;
  },
};

// =============================================================================
// Feedback & Preferences API
// =============================================================================

export interface FeedbackSubmitResult {
  feedbackId: string;
  message: string;
}

export interface PreferenceSearchResponse {
  preferences: PreferenceSearchResult['preferences'];
  summary?: string;
  contextBlock: string | null;
  count: number;
}

export const feedbackApi = {
  /**
   * Submit user feedback for a generated track
   */
  async submitFeedback(request: FeedbackRequest): Promise<FeedbackSubmitResult> {
    const response = await api.post<{ success: boolean; data: FeedbackSubmitResult }>(
      '/feedback',
      request
    );
    return response.data.data;
  },

  /**
   * Search for relevant user preferences based on a prompt
   */
  async searchPreferences(query: string, limit: number = 5): Promise<PreferenceSearchResponse> {
    const response = await api.post<{ success: boolean; data: PreferenceSearchResponse }>(
      '/feedback/search',
      { query, limit }
    );
    return response.data.data;
  },

  /**
   * Check feedback service health/configuration
   */
  async getHealth(): Promise<{ configured: boolean; status: Record<string, string> }> {
    const response = await api.get<{ success: boolean; configured: boolean; status: Record<string, string> }>(
      '/feedback/health'
    );
    return { configured: response.data.configured, status: response.data.status };
  },
};

// Re-export types for convenience
export type { FeedbackRequest, FeedbackRating };

