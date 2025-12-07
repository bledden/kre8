/**
 * useVoiceChat Hook
 * Integrates xAI Voice API with Strudel music generation
 *
 * When Grok calls generate_strudel, this hook:
 * 1. Sends the request to our backend /api/music/generate
 * 2. Receives Strudel code
 * 3. Executes it in Strudel
 * 4. Returns success to Grok so it can continue the conversation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  connect,
  disconnect,
  setHandlers,
  clearHandlers,
  sendTextMessage,
  isVoiceConnected,
  type ConnectionStatus,
} from '../services/voiceService';
import { musicApi } from '../services/api';
import { executeCode } from '../services/strudelService';
import { useAppStore } from '../stores/appStore';

interface GenerateStrudelArgs {
  genre: string;
  mood?: string;
  bpm?: number;
  description?: string;
}

export function useVoiceChat() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [transcript, setTranscript] = useState<string>('');
  const [grokTranscript, setGrokTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { setCurrentCode, setPlayback, addMessage, setLoading, setError: setAppError } = useAppStore();
  const grokTranscriptRef = useRef<string>('');

  /**
   * Handle generate_strudel function call from Grok
   */
  const handleGenerateStrudel = useCallback(
    async (args: GenerateStrudelArgs) => {
      console.log('[VoiceChat] Generating Strudel:', args);

      // Build prompt from Grok's request
      const promptParts: string[] = [];

      if (args.mood) {
        promptParts.push(args.mood);
      }

      promptParts.push(args.genre);

      if (args.bpm) {
        promptParts.push(`at ${args.bpm} BPM`);
      }

      if (args.description) {
        promptParts.push(args.description);
      }

      const prompt = promptParts.join(' ');

      try {
        setLoading(true);

        // Add user message to conversation
        addMessage({
          role: 'user',
          content: `[Voice] ${prompt}`,
          timestamp: new Date(),
        });

        // Generate Strudel code via our backend
        const result = await musicApi.generate({
          prompt,
          config: args.bpm ? { tempo: args.bpm } : undefined,
        });

        // Add assistant response
        addMessage({
          role: 'assistant',
          content: result.code,
          timestamp: new Date(),
        });

        // Execute in Strudel
        setCurrentCode(result);
        await executeCode(result);
        setPlayback({ isPlaying: true });

        console.log('[VoiceChat] Music generated and playing');

        return {
          success: true,
          message: `Generated ${args.genre} beat${args.bpm ? ` at ${args.bpm} BPM` : ''}`,
          code: result.code,
        };
      } catch (err) {
        console.error('[VoiceChat] Failed to generate music:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate music';
        setAppError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setCurrentCode, setPlayback, setLoading, setAppError]
  );

  /**
   * Handle function calls from Grok
   */
  const handleFunctionCall = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<unknown> => {
      console.log('[VoiceChat] Function call:', name, args);

      switch (name) {
        case 'generate_strudel':
          return handleGenerateStrudel(args as unknown as GenerateStrudelArgs);

        default:
          console.warn('[VoiceChat] Unknown function:', name);
          return { error: `Unknown function: ${name}` };
      }
    },
    [handleGenerateStrudel]
  );

  /**
   * Handle transcript updates
   */
  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      // This is user's transcribed speech
      setTranscript(text);
    } else {
      // This is Grok's streaming response
      grokTranscriptRef.current += text;
      setGrokTranscript(grokTranscriptRef.current);
    }
  }, []);

  /**
   * Handle status changes
   */
  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);

    // Clear Grok's transcript when new response starts
    if (newStatus === 'speaking') {
      grokTranscriptRef.current = '';
      setGrokTranscript('');
    }
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((err: Error) => {
    console.error('[VoiceChat] Error:', err);
    setError(err.message);
    setAppError(err.message);
  }, [setAppError]);

  /**
   * Start voice chat session
   */
  const startVoiceChat = useCallback(async () => {
    setError(null);
    setTranscript('');
    setGrokTranscript('');
    grokTranscriptRef.current = '';

    setHandlers({
      onFunctionCall: handleFunctionCall,
      onTranscript: handleTranscript,
      onStatusChange: handleStatusChange,
      onError: handleError,
    });

    try {
      await connect();
    } catch (err) {
      console.error('[VoiceChat] Failed to start:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [handleFunctionCall, handleTranscript, handleStatusChange, handleError]);

  /**
   * Stop voice chat session
   */
  const stopVoiceChat = useCallback(() => {
    disconnect();
    clearHandlers();
    setStatus('disconnected');
  }, []);

  /**
   * Send text message (alternative to voice)
   */
  const sendText = useCallback((text: string) => {
    if (isVoiceConnected()) {
      sendTextMessage(text);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isVoiceConnected()) {
        disconnect();
        clearHandlers();
      }
    };
  }, []);

  return {
    // State
    status,
    transcript, // User's speech
    grokTranscript, // Grok's response
    error,
    isConnected: status === 'connected' || status === 'speaking' || status === 'listening',
    isSpeaking: status === 'speaking',
    isListening: status === 'listening',

    // Actions
    startVoiceChat,
    stopVoiceChat,
    sendText,
  };
}
