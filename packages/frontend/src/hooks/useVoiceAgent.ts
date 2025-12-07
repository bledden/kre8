/**
 * Voice Agent Hook for xAI Realtime Voice API
 *
 * Provides real-time voice conversation with Kre8's AI assistant.
 * Uses direct WebSocket connection to xAI with ephemeral tokens.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { float32ToPCM16Base64, base64PCM16ToFloat32, calculateAudioLevel } from '../utils/audio';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
const XAI_REALTIME_URL = 'wss://api.x.ai/v1/realtime';
const CHUNK_DURATION_MS = 100;

// Message types from xAI Realtime API
interface RealtimeMessage {
  type: string;
  [key: string]: unknown;
}

interface SessionResponse {
  success: boolean;
  client_secret: {
    value: string;
    expires_at: number;
  };
  voice: string;
  instructions: string;
  realtime_url: string;
  error?: { message: string };
}

export interface TranscriptEntry {
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseVoiceAgentReturn {
  // Connection state
  isConnected: boolean;
  isCapturing: boolean;

  // Audio levels (0-1)
  inputLevel: number;

  // Transcript
  transcript: TranscriptEntry[];

  // Controls
  connect: () => Promise<void>;
  disconnect: () => void;

  // Error state
  error: string | null;
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for WebSocket and audio
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const currentPlaybackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isSessionConfiguredRef = useRef(false);
  const currentTranscriptRef = useRef<{ role: 'user' | 'assistant'; content: string } | null>(null);
  const sessionConfigRef = useRef<{ voice: string; instructions: string; sampleRate: number } | null>(null);

  /**
   * Get or create AudioContext
   */
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      console.log(`[VoiceAgent] Audio context initialized at ${audioContextRef.current.sampleRate}Hz`);
    }
    return audioContextRef.current;
  }, []);

  /**
   * Stop audio playback (for interruptions)
   */
  const stopPlayback = useCallback(() => {
    if (currentPlaybackSourceRef.current) {
      try {
        currentPlaybackSourceRef.current.stop();
        currentPlaybackSourceRef.current.disconnect();
      } catch {
        // Source may already be stopped
      }
      currentPlaybackSourceRef.current = null;
    }
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  /**
   * Play next audio chunk from queue
   */
  const playNextChunk = useCallback((audioContext: AudioContext) => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentPlaybackSourceRef.current = null;
      return;
    }

    const chunk = playbackQueueRef.current.shift()!;
    const audioBuffer = audioContext.createBuffer(1, chunk.length, audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(chunk);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    currentPlaybackSourceRef.current = source;

    source.onended = () => {
      if (currentPlaybackSourceRef.current === source) {
        currentPlaybackSourceRef.current = null;
      }
      playNextChunk(audioContext);
    };

    source.start();
  }, []);

  /**
   * Play received audio
   */
  const playAudio = useCallback((base64Audio: string) => {
    try {
      const audioContext = getAudioContext();
      const float32Data = base64PCM16ToFloat32(base64Audio);
      playbackQueueRef.current.push(float32Data);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        playNextChunk(audioContext);
      }
    } catch (err) {
      console.error('[VoiceAgent] Error playing audio:', err);
    }
  }, [getAudioContext, playNextChunk]);

  /**
   * Configure xAI session after WebSocket opens
   */
  const configureSession = useCallback((ws: WebSocket) => {
    if (!sessionConfigRef.current) return;

    const { voice, instructions, sampleRate } = sessionConfigRef.current;
    console.log(`[VoiceAgent] Configuring session with ${sampleRate}Hz audio...`);

    const sessionConfig = {
      type: 'session.update',
      session: {
        instructions,
        voice,
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: sampleRate },
          },
          output: {
            format: { type: 'audio/pcm', rate: sampleRate },
          },
        },
        turn_detection: { type: 'server_vad' },
      },
    };

    ws.send(JSON.stringify(sessionConfig));
  }, []);

  /**
   * Send initial greeting after session is configured
   */
  const sendInitialGreeting = useCallback((ws: WebSocket) => {
    console.log('[VoiceAgent] Session configured, sending greeting...');

    ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));

    const greetingMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Say hello briefly and let the user know you are ready to help them create music.',
          },
        ],
      },
    };
    ws.send(JSON.stringify(greetingMessage));
    ws.send(JSON.stringify({ type: 'response.create' }));

    console.log('[VoiceAgent] Ready for voice interaction');
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((message: RealtimeMessage) => {
    // Handle bot audio
    if (message.type === 'response.output_audio.delta' && 'delta' in message) {
      playAudio(message.delta as string);
    }

    // Handle bot transcript delta
    if (message.type === 'response.output_audio_transcript.delta' && 'delta' in message) {
      const delta = message.delta as string;

      if (currentTranscriptRef.current?.role === 'assistant') {
        currentTranscriptRef.current.content += delta;
        setTranscript((prev) => {
          const newTranscript = [...prev];
          if (newTranscript.length > 0) {
            newTranscript[newTranscript.length - 1].content = currentTranscriptRef.current!.content;
          }
          return newTranscript;
        });
      } else {
        currentTranscriptRef.current = { role: 'assistant', content: delta };
        setTranscript((prev) => [
          ...prev,
          { timestamp: new Date().toISOString(), role: 'assistant', content: delta },
        ]);
      }
    }

    // Handle response done
    if (message.type === 'response.done') {
      currentTranscriptRef.current = null;
    }

    // Handle user speech started (interruption)
    if (message.type === 'input_audio_buffer.speech_started') {
      stopPlayback();
      currentTranscriptRef.current = { role: 'user', content: '' };
      setTranscript((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
          return prev;
        }
        return [...prev, { timestamp: new Date().toISOString(), role: 'user', content: '...' }];
      });
    }

    // Handle user speech committed
    if (message.type === 'input_audio_buffer.committed') {
      currentTranscriptRef.current = null;
    }

    // Handle user transcript
    if (message.type === 'conversation.item.added' && 'item' in message) {
      const item = message.item as { role?: string; content?: Array<{ type: string; transcript?: string }> };
      if (item.role === 'user' && item.content) {
        for (const contentItem of item.content) {
          if (contentItem.type === 'input_audio' && contentItem.transcript) {
            const transcriptText = contentItem.transcript;
            setTranscript((prev) => {
              if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
                const newTranscript = [...prev];
                const lastEntry = newTranscript[newTranscript.length - 1];
                const existingContent = lastEntry.content === '...' ? '' : lastEntry.content + ' ';
                newTranscript[newTranscript.length - 1] = {
                  ...lastEntry,
                  content: existingContent + transcriptText,
                };
                return newTranscript;
              }
              return [
                ...prev,
                { timestamp: new Date().toISOString(), role: 'user' as const, content: transcriptText },
              ];
            });
            break;
          }
        }
      }
    }
  }, [playAudio, stopPlayback]);

  /**
   * Start audio capture
   */
  const startCapture = useCallback(async (sendAudio: (base64: string) => void): Promise<number> => {
    const audioContext = getAudioContext();
    const nativeSampleRate = audioContext.sampleRate;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: nativeSampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    mediaStreamRef.current = stream;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const bufferSize = 4096;
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    let audioBuffer: Float32Array[] = [];
    let totalSamples = 0;
    const chunkSizeSamples = (audioContext.sampleRate * CHUNK_DURATION_MS) / 1000;

    processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);

      // Calculate and set audio level
      setInputLevel(calculateAudioLevel(inputData));

      // Buffer audio data
      audioBuffer.push(new Float32Array(inputData));
      totalSamples += inputData.length;

      // Send chunks of ~100ms
      while (totalSamples >= chunkSizeSamples) {
        const chunk = new Float32Array(chunkSizeSamples);
        let offset = 0;

        while (offset < chunkSizeSamples && audioBuffer.length > 0) {
          const buffer = audioBuffer[0];
          const needed = chunkSizeSamples - offset;
          const available = buffer.length;

          if (available <= needed) {
            chunk.set(buffer, offset);
            offset += available;
            totalSamples -= available;
            audioBuffer.shift();
          } else {
            chunk.set(buffer.subarray(0, needed), offset);
            audioBuffer[0] = buffer.subarray(needed);
            offset += needed;
            totalSamples -= needed;
          }
        }

        const base64Audio = float32ToPCM16Base64(chunk);
        sendAudio(base64Audio);
      }
    };

    processorNodeRef.current = processor;
    source.connect(processor);
    processor.connect(audioContext.destination);

    setIsCapturing(true);
    console.log(`[VoiceAgent] Audio capture started at ${nativeSampleRate}Hz`);

    return nativeSampleRate;
  }, [getAudioContext]);

  /**
   * Stop audio capture
   */
  const stopCapture = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturing(false);
    setInputLevel(0);
  }, []);

  /**
   * Connect to xAI Realtime API
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      console.log('[VoiceAgent] Getting ephemeral token...');

      // Get ephemeral token from backend
      const response = await fetch(`${API_BASE_URL}/api/realtime/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to get session: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();

      if (!data.success || data.error) {
        throw new Error(data.error?.message || 'Failed to create session');
      }

      const ephemeralToken = data.client_secret.value;
      console.log(`[VoiceAgent] Token received, expires at: ${new Date(data.client_secret.expires_at * 1000).toISOString()}`);

      // Start audio capture first to get sample rate
      const sendAudio = (base64Audio: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && isSessionConfiguredRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          }));
        }
      };

      const sampleRate = await startCapture(sendAudio);

      // Store session config
      sessionConfigRef.current = {
        voice: data.voice,
        instructions: data.instructions,
        sampleRate,
      };
      isSessionConfiguredRef.current = false;

      // Connect to xAI Realtime API
      console.log(`[VoiceAgent] Connecting to ${XAI_REALTIME_URL}...`);
      const ws = new WebSocket(XAI_REALTIME_URL, [
        'realtime',
        `openai-insecure-api-key.${ephemeralToken}`,
        'openai-beta.realtime-v1',
      ]);

      ws.onopen = () => {
        console.log('[VoiceAgent] WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);

          // Handle conversation created - configure session
          if (message.type === 'conversation.created' && !isSessionConfiguredRef.current) {
            console.log('[VoiceAgent] Conversation created, configuring...');
            configureSession(ws);
          }

          // Handle session updated - send initial greeting
          if (message.type === 'session.updated' && !isSessionConfiguredRef.current) {
            isSessionConfiguredRef.current = true;
            sendInitialGreeting(ws);
          }

          handleMessage(message);
        } catch (err) {
          console.error('[VoiceAgent] Error parsing message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[VoiceAgent] WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log(`[VoiceAgent] WebSocket closed - Code: ${event.code}`);
        setIsConnected(false);
        isSessionConfiguredRef.current = false;
        stopCapture();
        stopPlayback();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[VoiceAgent] Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      stopCapture();
      throw err;
    }
  }, [startCapture, stopCapture, stopPlayback, configureSession, sendInitialGreeting, handleMessage]);

  /**
   * Disconnect from xAI Realtime API
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    isSessionConfiguredRef.current = false;
    setTranscript([]);
    currentTranscriptRef.current = null;
    stopCapture();
    stopPlayback();
  }, [stopCapture, stopPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [disconnect]);

  return {
    isConnected,
    isCapturing,
    inputLevel,
    transcript,
    connect,
    disconnect,
    error,
  };
}
