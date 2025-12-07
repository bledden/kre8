/**
 * Core type definitions for the Kre8 application
 */

export interface StrudelCode {
  code: string;
  explanation?: string;
  metadata?: {
    tempo?: number;      // Deprecated: use bpm instead
    bpm?: number;        // Perceived BPM (for display)
    cpm?: number;        // Cycles per minute (for Strudel)
    instruments?: string[];
    duration?: number;
  };
}

export type GenerationMode = 'auto' | 'loop' | 'arrangement' | 'layer';

export interface MusicConfig {
  tempo?: number;
  scale?: string;
  key?: string;
  samples?: Record<string, string>;
  style?: string;
  mode?: GenerationMode;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface UserContext {
  location?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  timezone?: string;
  localTime?: string;
}

export interface Layer {
  id: string;
  code: string;
  name: string;
  muted: boolean;
}

export interface GenerationRequest {
  prompt: string;
  config?: MusicConfig;
  conversationHistory?: Message[];
  refinement?: boolean;
  context?: UserContext;
  existingLayers?: Layer[];
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

// User Feedback Types
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface UserFeedback {
  id: string;
  rating: FeedbackRating;
  textFeedback?: string;
  prompt: string;
  code: string;
  metadata: {
    tempo?: number;
    genre?: string;
    instruments?: string[];
    listenDurationMs?: number;
  };
  createdAt: Date;
}

export interface FeedbackRequest {
  rating: FeedbackRating;
  textFeedback?: string;
  prompt: string;
  code: string;
  metadata?: {
    tempo?: number;
    genre?: string;
    instruments?: string[];
    listenDurationMs?: number;
  };
}

export interface RelevantPreference {
  rating: FeedbackRating;
  textFeedback?: string;
  prompt: string;
  similarity: number;
}

export interface PreferenceSearchResult {
  preferences: RelevantPreference[];
  summary?: string;
}

