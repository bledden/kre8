/**
 * xAI Grok Voice API Service
 * Real-time WebSocket connection for voice conversations with Grok
 *
 * Flow:
 * 1. Get ephemeral token from backend (/api/realtime/session)
 * 2. Connect WebSocket to wss://api.x.ai/v1/realtime with token
 * 3. Send session.update with voice, instructions, tools
 * 4. Stream audio in/out for real-time conversation
 * 5. Handle function calls (generate_strudel) from Grok
 */

// Audio configuration
const SAMPLE_RATE = 24000; // 24kHz - recommended for most use cases
const AUDIO_FORMAT = 'audio/pcm';

// Session state
let websocket: WebSocket | null = null;
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let audioWorkletNode: AudioWorkletNode | null = null;
let isConnected = false;
let sessionConfig: SessionConfig | null = null;

// Event handlers
type FunctionCallHandler = (name: string, args: Record<string, unknown>) => Promise<unknown>;
type AudioHandler = (audioData: Float32Array) => void;
type TranscriptHandler = (text: string, isFinal: boolean) => void;
type StatusHandler = (status: ConnectionStatus) => void;
type ErrorHandler = (error: Error) => void;

let onFunctionCall: FunctionCallHandler | null = null;
let onAudioOutput: AudioHandler | null = null;
let onTranscript: TranscriptHandler | null = null;
let onStatusChange: StatusHandler | null = null;
let onError: ErrorHandler | null = null;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error';

interface SessionConfig {
  clientSecret: string;
  realtimeUrl: string;
  voice: string;
  instructions: string;
  tools: Array<{
    type: string;
    name?: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;
}

interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: unknown;
}

/**
 * Fetch ephemeral session token from backend
 */
async function getSessionToken(): Promise<SessionConfig> {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const response = await fetch(`${API_BASE_URL}/realtime/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice: 'Eve', // Energetic, upbeat - perfect for DJ
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get session token: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to create session');
  }

  return {
    clientSecret: data.client_secret.value,
    realtimeUrl: data.realtime_url,
    voice: data.voice,
    instructions: data.instructions,
    tools: data.tools,
  };
}

/**
 * Convert Float32Array to base64 PCM16
 */
function float32ToBase64PCM16(float32Array: Float32Array): string {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 PCM16 to Float32Array
 */
function base64PCM16ToFloat32(base64String: string): Float32Array {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768.0;
  }
  return float32;
}

/**
 * Initialize audio input (microphone)
 */
async function initAudioInput(): Promise<void> {
  // Create AudioContext with correct sample rate
  audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

  // Get microphone access
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: SAMPLE_RATE,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  // Create audio processing pipeline
  const source = audioContext.createMediaStreamSource(mediaStream);

  // Use ScriptProcessorNode for audio capture (AudioWorklet would be better but more complex)
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (event) => {
    if (!isConnected || !websocket) return;

    const inputData = event.inputBuffer.getChannelData(0);
    const base64Audio = float32ToBase64PCM16(inputData);

    // Send audio to xAI
    sendEvent({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  console.log('[Voice] Audio input initialized');
}

/**
 * Play audio output from Grok
 */
function playAudioOutput(audioData: Float32Array): void {
  if (!audioContext) {
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
  }

  const buffer = audioContext.createBuffer(1, audioData.length, SAMPLE_RATE);
  buffer.copyToChannel(new Float32Array(audioData), 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  // Also pass to handler for visualization
  if (onAudioOutput) {
    onAudioOutput(audioData);
  }
}

/**
 * Send event to WebSocket
 */
function sendEvent(event: RealtimeEvent): void {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    console.warn('[Voice] WebSocket not connected, cannot send event');
    return;
  }
  websocket.send(JSON.stringify(event));
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(event: MessageEvent): void {
  try {
    const data: RealtimeEvent = JSON.parse(event.data);
    console.log('[Voice] Received:', data.type);

    switch (data.type) {
      case 'session.created':
        console.log('[Voice] Session created');
        break;

      case 'session.updated':
        console.log('[Voice] Session updated');
        setStatus('connected');
        break;

      case 'conversation.created':
        console.log('[Voice] Conversation started');
        break;

      case 'input_audio_buffer.speech_started':
        setStatus('speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        setStatus('listening');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User's speech transcribed
        if (onTranscript && data.transcript) {
          onTranscript(data.transcript as string, true);
        }
        break;

      case 'response.output_audio.delta':
        // Grok is speaking - play the audio
        if (data.delta) {
          const audioData = base64PCM16ToFloat32(data.delta as string);
          playAudioOutput(audioData);
        }
        break;

      case 'response.output_audio_transcript.delta':
        // Grok's speech transcript (streaming)
        if (onTranscript && data.delta) {
          onTranscript(data.delta as string, false);
        }
        break;

      case 'response.function_call_arguments.done':
        // Grok wants to call a function (e.g., generate_strudel)
        handleFunctionCall(data);
        break;

      case 'response.done':
        setStatus('listening');
        break;

      case 'error':
        console.error('[Voice] Error from server:', data);
        if (onError) {
          onError(new Error((data.error as { message?: string })?.message || 'Unknown error'));
        }
        break;

      default:
        // Log other events for debugging
        if (data.type.includes('error')) {
          console.error('[Voice] Error event:', data);
        }
    }
  } catch (error) {
    console.error('[Voice] Failed to parse message:', error);
  }
}

/**
 * Handle function calls from Grok
 */
async function handleFunctionCall(event: RealtimeEvent): Promise<void> {
  const functionName = event.name as string;
  const callId = event.call_id as string;
  let args: Record<string, unknown> = {};

  try {
    args = JSON.parse(event.arguments as string);
  } catch {
    args = {};
  }

  console.log('[Voice] Function call:', functionName, args);

  if (onFunctionCall) {
    try {
      const result = await onFunctionCall(functionName, args);

      // Send result back to Grok
      sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result),
        },
      });

      // Request Grok to continue
      sendEvent({ type: 'response.create' });
    } catch (error) {
      console.error('[Voice] Function call failed:', error);

      // Send error back to Grok
      sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify({ error: (error as Error).message }),
        },
      });
      sendEvent({ type: 'response.create' });
    }
  }
}

/**
 * Update connection status
 */
function setStatus(status: ConnectionStatus): void {
  if (onStatusChange) {
    onStatusChange(status);
  }
}

/**
 * Connect to xAI Realtime Voice API
 */
export async function connect(): Promise<void> {
  if (isConnected) {
    console.warn('[Voice] Already connected');
    return;
  }

  setStatus('connecting');

  try {
    // Get ephemeral token from backend
    sessionConfig = await getSessionToken();
    console.log('[Voice] Got session token, connecting to WebSocket...');

    // Connect to xAI WebSocket
    websocket = new WebSocket(sessionConfig.realtimeUrl, [
      'realtime',
      `openai-insecure-api-key.${sessionConfig.clientSecret}`,
      'openai-beta.realtime-v1',
    ]);

    websocket.onopen = async () => {
      console.log('[Voice] WebSocket connected');
      isConnected = true;

      // Send session configuration
      sendEvent({
        type: 'session.update',
        session: {
          voice: sessionConfig!.voice,
          instructions: sessionConfig!.instructions,
          turn_detection: { type: 'server_vad' },
          tools: sessionConfig!.tools,
          audio: {
            input: { format: { type: AUDIO_FORMAT, rate: SAMPLE_RATE } },
            output: { format: { type: AUDIO_FORMAT, rate: SAMPLE_RATE } },
          },
        },
      });

      // Initialize audio input
      await initAudioInput();

      setStatus('connected');
      console.log('[Voice] Session configured, ready for conversation');
    };

    websocket.onmessage = handleMessage;

    websocket.onerror = (error) => {
      console.error('[Voice] WebSocket error:', error);
      setStatus('error');
      if (onError) {
        onError(new Error('WebSocket connection error'));
      }
    };

    websocket.onclose = (event) => {
      console.log('[Voice] WebSocket closed:', event.code, event.reason);
      isConnected = false;
      setStatus('disconnected');
      cleanup();
    };
  } catch (error) {
    console.error('[Voice] Failed to connect:', error);
    setStatus('error');
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
}

/**
 * Disconnect from Voice API
 */
export function disconnect(): void {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  cleanup();
  isConnected = false;
  setStatus('disconnected');
  console.log('[Voice] Disconnected');
}

/**
 * Cleanup resources
 */
function cleanup(): void {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (audioWorkletNode) {
    audioWorkletNode.disconnect();
    audioWorkletNode = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

/**
 * Send a text message (instead of voice)
 */
export function sendTextMessage(text: string): void {
  if (!isConnected) {
    console.warn('[Voice] Not connected');
    return;
  }

  // Create conversation item with text
  sendEvent({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text }],
    },
  });

  // Request response
  sendEvent({ type: 'response.create' });
}

/**
 * Check if connected
 */
export function isVoiceConnected(): boolean {
  return isConnected;
}

/**
 * Set event handlers
 */
export function setHandlers(handlers: {
  onFunctionCall?: FunctionCallHandler;
  onAudioOutput?: AudioHandler;
  onTranscript?: TranscriptHandler;
  onStatusChange?: StatusHandler;
  onError?: ErrorHandler;
}): void {
  if (handlers.onFunctionCall) onFunctionCall = handlers.onFunctionCall;
  if (handlers.onAudioOutput) onAudioOutput = handlers.onAudioOutput;
  if (handlers.onTranscript) onTranscript = handlers.onTranscript;
  if (handlers.onStatusChange) onStatusChange = handlers.onStatusChange;
  if (handlers.onError) onError = handlers.onError;
}

/**
 * Clear event handlers
 */
export function clearHandlers(): void {
  onFunctionCall = null;
  onAudioOutput = null;
  onTranscript = null;
  onStatusChange = null;
  onError = null;
}
