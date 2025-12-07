import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Send, Loader2, Radio, Repeat, Music } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { musicApi, transcriptionApi } from '../services/api';
import { startRecording, stopRecording } from '../services/audioRecorder';
import { executeCode, setPatternBaseTempo } from '../services/strudelService';
import { useVoiceChat } from '../hooks/useVoiceChat';
import type { UserContext, GenerationMode } from '@kre8/shared';

export default function InputPanel() {
  const [prompt, setPrompt] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentCode, setLoading, setError, addMessage, currentCode, setPlayback } = useAppStore();

  // Voice Chat (real-time conversation with Grok)
  const {
    status: voiceStatus,
    transcript: userTranscript,
    grokTranscript,
    isConnected: isVoiceChatActive,
    startVoiceChat,
    stopVoiceChat,
  } = useVoiceChat();

  // Gather user context on mount (timezone/time always, location if permitted)
  // Context is always passed to Grok - Grok decides when to use it based on the prompt
  useEffect(() => {
    gatherUserContext();
  }, []);

  async function gatherUserContext() {
    const context: UserContext = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
    };

    // Try to get location (requires user permission)
    // This prompts once on first use - if denied, we continue without location
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000, // Cache for 5 minutes
          });
        });

        context.location = {
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };

        // Reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`,
            { headers: { 'User-Agent': 'Kre8-Music-App' } }
          );
          const data = await response.json();
          if (data.address) {
            context.location.city = data.address.city || data.address.town || data.address.village;
            context.location.country = data.address.country;
          }
        } catch {
          // Geocoding failed, continue with coordinates only
        }
      } catch {
        // Geolocation permission denied or failed - that's fine
        console.log('Geolocation not available - context will use timezone/time only');
      }
    }

    setUserContext(context);
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isRecordingAudio) return;

    setLoading(true);
    setError(undefined);

    try {
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      });

      // Build request - always include context if available
      // Grok will decide whether to use tools based on the prompt intent
      const request: Parameters<typeof musicApi.generate>[0] = {
        prompt,
        conversationHistory: useAppStore.getState().conversation,
        refinement: !!currentCode,
        config: generationMode !== 'auto' ? { mode: generationMode } : undefined,
      };

      // Always pass context - Grok intelligently decides when to use it
      if (userContext) {
        request.context = {
          ...userContext,
          // Refresh time for each request
          localTime: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
        };
      }

      // Generate code
      const result = await musicApi.generate(request);

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: result.code,
        timestamp: new Date(),
      });

      // Set current code and execute (auto-play)
      setCurrentCode(result);

      // Set base tempo from the generated code's metadata for relative tempo adjustments
      const generatedTempo = result.metadata?.tempo || 120;
      setPatternBaseTempo(generatedTempo);

      await executeCode(result);
      setPlayback({ isPlaying: true, tempo: generatedTempo });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate music');
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecordingAudio) {
      // Stop recording
      try {
        const audioBlob = await stopRecording();
        setIsRecordingAudio(false);
        setLoading(true);

        // Transcribe
        const transcription = await transcriptionApi.transcribe(audioBlob);

        // Use transcribed text as prompt
        setPrompt(transcription.text);

        // Auto-submit
        setTimeout(() => {
          handleTextSubmit(new Event('submit') as any);
        }, 100);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
        setIsRecordingAudio(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecordingAudio(true);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Microphone access denied');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Assume it's an audio file for transcription
      const transcription = await transcriptionApi.transcribe(file);
      setPrompt(transcription.text);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const { isLoading } = useAppStore();

  // Genre suggestion tags
  const GENRE_SUGGESTIONS = [
    { label: 'Lo-fi', prompt: 'Create a chill lo-fi hip-hop beat' },
    { label: 'Techno', prompt: 'Make a driving techno track' },
    { label: 'Trap', prompt: 'Create a hard-hitting trap beat' },
    { label: 'House', prompt: 'Make a groovy deep house track' },
    { label: 'Ambient', prompt: 'Create a peaceful ambient soundscape' },
    { label: 'D&B', prompt: 'Make an energetic drum and bass beat' },
  ];

  const handleGenreClick = (genrePrompt: string) => {
    setPrompt(genrePrompt);
  };

  // Toggle voice chat
  const handleVoiceChatToggle = async () => {
    if (isVoiceChatActive) {
      stopVoiceChat();
    } else {
      await startVoiceChat();
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Create a Beat</h2>

        {/* Voice Chat Toggle */}
        <button
          type="button"
          onClick={handleVoiceChatToggle}
          disabled={isLoading || isRecordingAudio}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            isVoiceChatActive
              ? 'bg-green-600 text-white animate-pulse'
              : 'bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80'
          }`}
        >
          <Radio className="w-4 h-4" />
          {isVoiceChatActive ? 'Live' : 'Voice Chat'}
        </button>
      </div>

      {/* Voice Chat Active Panel */}
      {isVoiceChatActive && (
        <div className="mb-4 p-4 rounded-lg bg-green-900/20 border border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400 font-medium">
              {voiceStatus === 'speaking' ? 'You are speaking...' :
               voiceStatus === 'listening' ? 'Listening...' :
               voiceStatus === 'connecting' ? 'Connecting...' :
               'Connected - Talk to Kre8!'}
            </span>
          </div>

          {/* User transcript */}
          {userTranscript && (
            <div className="text-sm text-text-secondary mb-2">
              <span className="text-text-primary font-medium">You: </span>
              {userTranscript}
            </div>
          )}

          {/* Grok's response */}
          {grokTranscript && (
            <div className="text-sm text-green-300">
              <span className="text-green-400 font-medium">Kre8: </span>
              {grokTranscript}
            </div>
          )}

          <p className="text-xs text-text-secondary mt-3">
            Say things like &quot;make me a chill lo-fi beat&quot; or &quot;drop some hard techno&quot;
          </p>
        </div>
      )}

      <form onSubmit={handleTextSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isVoiceChatActive
              ? "Voice chat active - just talk! Or type here..."
              : "Describe your beat: 'lo-fi hip-hop', 'fast techno', 'ambient drone', 'trap with 808s'..."
            }
            className="input-field w-full h-24 resize-none"
            disabled={isLoading || isRecordingAudio}
          />
        </div>

        {/* Genre Suggestions & Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-secondary mr-1">Try:</span>
          {GENRE_SUGGESTIONS.map((genre) => (
            <button
              key={genre.label}
              type="button"
              onClick={() => handleGenreClick(genre.prompt)}
              disabled={isLoading || isRecordingAudio}
              className="text-xs px-2 py-1 rounded-full bg-x-blue/20 text-x-blue hover:bg-x-blue/30 transition-colors disabled:opacity-50"
            >
              {genre.label}
            </button>
          ))}

          {/* Mode Selector - appears on the right */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-text-secondary mr-1">Mode:</span>
            <button
              type="button"
              onClick={() => setGenerationMode('auto')}
              className={`text-xs px-2 py-1 rounded-l-full border transition-colors ${
                generationMode === 'auto'
                  ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                  : 'bg-surface-elevated text-text-secondary border-border-primary hover:bg-surface-elevated/80'
              }`}
              title="Let Grok decide based on your prompt"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('loop')}
              className={`text-xs px-2 py-1 border-y transition-colors flex items-center gap-1 ${
                generationMode === 'loop'
                  ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                  : 'bg-surface-elevated text-text-secondary border-border-primary hover:bg-surface-elevated/80'
              }`}
              title="Simple loop for layering"
            >
              <Repeat className="w-3 h-3" />
              Loop
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('arrangement')}
              className={`text-xs px-2 py-1 rounded-r-full border transition-colors flex items-center gap-1 ${
                generationMode === 'arrangement'
                  ? 'bg-green-500/30 text-green-300 border-green-500/50'
                  : 'bg-surface-elevated text-text-secondary border-border-primary hover:bg-surface-elevated/80'
              }`}
              title="Full arrangement with builds & drops"
            >
              <Music className="w-3 h-3" />
              Song
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Push-to-talk (old STT method) - hidden when voice chat is active */}
          {!isVoiceChatActive && (
            <button
              type="button"
              onClick={handleVoiceRecord}
              disabled={isLoading}
              className={`btn-secondary flex items-center gap-2 ${
                isRecordingAudio ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''
              }`}
            >
              {isRecordingAudio ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecordingAudio ? 'Stop' : 'Record'}
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecordingAudio || isVoiceChatActive}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || isRecordingAudio}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
