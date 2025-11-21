import axios from 'axios';
import {
  GenerationRequest,
  StrudelCode,
  TranscriptionResponse,
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

