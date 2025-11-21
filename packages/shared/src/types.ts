/**
 * Core type definitions for the Kre8 application
 */

export interface StrudelCode {
  code: string;
  explanation?: string;
  metadata?: {
    tempo?: number;
    instruments?: string[];
    duration?: number;
  };
}

export interface MusicConfig {
  tempo?: number;
  scale?: string;
  key?: string;
  samples?: Record<string, string>;
  style?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface GenerationRequest {
  prompt: string;
  config?: MusicConfig;
  conversationHistory?: Message[];
  refinement?: boolean;
}

export interface AIServiceResponse {
  code: string;
  explanation?: string;
  model?: string;
  tokensUsed?: number;
  finishReason?: string;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  confidence?: number;
}

export interface AudioRecordingState {
  isRecording: boolean;
  duration: number;
  blob?: Blob;
}

export interface PlaybackState {
  isPlaying: boolean;
  tempo: number;
  currentPattern?: StrudelCode;
}

export interface AppState {
  currentCode?: StrudelCode;
  playback: PlaybackState;
  recording: AudioRecordingState;
  conversation: Message[];
  isLoading: boolean;
  error?: string;
}

