import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StrudelCode, Message, PlaybackState, AudioRecordingState, Layer } from '@kre8/shared';

// A favorite is a 5-star rated config (code + metadata, no prompt)
export interface Favorite {
  id: string;
  code: string;
  genre?: string;
  tempo?: number;
  instruments?: string[];
  createdAt: Date;
}

interface AppState {
  currentCode?: StrudelCode;
  conversation: Message[];
  playback: PlaybackState;
  recording: AudioRecordingState;
  isLoading: boolean;
  error?: string;
  inputMessage: string;
  layers: Layer[];
  recentFavorites: Favorite[];

  // Actions
  setCurrentCode: (code: StrudelCode) => void;
  addMessage: (message: Message) => void;
  setPlayback: (playback: Partial<PlaybackState>) => void;
  setRecording: (recording: Partial<AudioRecordingState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  setInputMessage: (message: string) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  toggleLayerMute: (id: string) => void;
  clearLayers: () => void;
  addFavorite: (favorite: Omit<Favorite, 'id' | 'createdAt'>) => void;
  removeFavorite: (id: string) => void;
}

const MAX_FAVORITES = 8;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      inputMessage: '',
      layers: [],
      recentFavorites: [],

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

      setInputMessage: (message) => set({ inputMessage: message }),

      addLayer: (layer) => set((state) => ({
        layers: [...state.layers, layer],
      })),

      removeLayer: (id) => set((state) => ({
        layers: state.layers.filter((l) => l.id !== id),
      })),

      toggleLayerMute: (id) => set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, muted: !l.muted } : l
        ),
      })),

      clearLayers: () => set({ layers: [] }),

      addFavorite: (favorite) => set((state) => {
        const newFavorite: Favorite = {
          ...favorite,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        // Keep only most recent favorites, newest first
        const updated = [newFavorite, ...state.recentFavorites].slice(0, MAX_FAVORITES);
        return { recentFavorites: updated };
      }),

      removeFavorite: (id) => set((state) => ({
        recentFavorites: state.recentFavorites.filter((f) => f.id !== id),
      })),
    }),
    {
      name: 'kre8-storage',
      partialize: (state) => ({ recentFavorites: state.recentFavorites }),
    }
  )
);

