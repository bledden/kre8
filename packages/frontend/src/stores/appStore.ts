import { create } from 'zustand';
import { StrudelCode, Message, PlaybackState, AudioRecordingState } from '@kre8/shared';

interface AppState {
  currentCode?: StrudelCode;
  conversation: Message[];
  playback: PlaybackState;
  recording: AudioRecordingState;
  isLoading: boolean;
  error?: string;
  
  // Actions
  setCurrentCode: (code: StrudelCode) => void;
  addMessage: (message: Message) => void;
  setPlayback: (playback: Partial<PlaybackState>) => void;
  setRecording: (recording: Partial<AudioRecordingState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentCode: undefined,
  conversation: [],
  playback: {
    isPlaying: false,
    tempo: 120,
  },
  recording: {
    isRecording: false,
    duration: 0,
  },
  isLoading: false,
  error: undefined,

  setCurrentCode: (code) => set({ currentCode: code }),
  
  addMessage: (message) => set((state) => ({
    conversation: [...state.conversation, message],
  })),
  
  setPlayback: (updates) => set((state) => ({
    playback: { ...state.playback, ...updates },
  })),
  
  setRecording: (updates) => set((state) => ({
    recording: { ...state.recording, ...updates },
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: undefined }),
}));

