/**
 * Audio recording service for capturing Strudel audio output
 * Uses Web Audio API to record from AudioContext destination
 */
import { getAudioContext } from '@strudel/web';

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;
let destinationNode: MediaStreamAudioDestinationNode | null = null;
let recordingStartTime: number = 0;

/**
 * Start recording audio from Strudel's output
 * This captures the actual synthesized audio, not microphone input
 */
export async function startStrudelRecording(): Promise<void> {
  try {
    const audioContext = getAudioContext();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Create a MediaStreamDestination to capture audio output
    destinationNode = audioContext.createMediaStreamDestination();

    // Connect the AudioContext destination to our recording stream
    // We use a ChannelMergerNode to tap into the output without disrupting playback
    const analyser = audioContext.createAnalyser();
    analyser.connect(destinationNode);
    analyser.connect(audioContext.destination);

    // Note: We need to modify strudelService to route through this node
    // For now, store the destination so it can be connected externally

    // Create a MediaRecorder from the destination's stream
    mediaRecorder = new MediaRecorder(destinationNode.stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    audioChunks = [];
    recordingStartTime = Date.now();

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Request data every 100ms for smoother recording
    mediaRecorder.start(100);

    console.log('[AudioRecorder] Started recording Strudel output');
  } catch (error) {
    console.error('[AudioRecorder] Failed to start Strudel recording:', error);
    throw new Error('Failed to start audio recording');
  }
}

/**
 * Get the destination node for routing audio to the recorder
 * Call this after startStrudelRecording() and connect your audio source to it
 */
export function getRecordingDestination(): MediaStreamAudioDestinationNode | null {
  return destinationNode;
}

/**
 * Start recording from microphone (for voice input transcription)
 */
export async function startRecording(): Promise<void> {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    audioChunks = [];
    recordingStartTime = Date.now();

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100);
    console.log('[AudioRecorder] Started recording microphone');
  } catch (error) {
    console.error('[AudioRecorder] Failed to start microphone recording:', error);
    throw new Error('Microphone access denied or unavailable');
  }
}

/**
 * Stop recording and return audio blob
 */
export async function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No active recording'));
      return;
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });

      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      if (destinationNode) {
        destinationNode = null;
      }
      mediaRecorder = null;
      audioChunks = [];

      const duration = Date.now() - recordingStartTime;
      console.log(`[AudioRecorder] Recording stopped. Duration: ${duration}ms, Size: ${audioBlob.size} bytes`);

      resolve(audioBlob);
    };

    mediaRecorder.onerror = (event) => {
      reject(new Error(`Recording error: ${event}`));
    };

    mediaRecorder.stop();
  });
}

/**
 * Check if recording is active
 */
export function isRecording(): boolean {
  return mediaRecorder?.state === 'recording';
}

/**
 * Force stop any active recording and release microphone
 * Use this for cleanup on component unmount or error recovery
 */
export function forceStopRecording(): void {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (e) {
      // Ignore errors during force stop
    }
  }

  // Always stop stream tracks to release microphone
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('[AudioRecorder] Force stopped track:', track.kind);
    });
    stream = null;
  }

  if (destinationNode) {
    destinationNode = null;
  }

  mediaRecorder = null;
  audioChunks = [];
  console.log('[AudioRecorder] Force stopped and cleaned up');
}

/**
 * Get current recording duration in milliseconds
 */
export function getRecordingDuration(): number {
  if (!isRecording()) return 0;
  return Date.now() - recordingStartTime;
}

/**
 * Download audio blob as file
 */
export function downloadAudio(blob: Blob, filename: string = 'recording.webm'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert WebM blob to WAV format for broader compatibility
 * WAV is universally supported and better for sharing
 */
export async function convertToWav(webmBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const arrayBuffer = fileReader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert AudioBuffer to WAV
        const wavBlob = audioBufferToWav(audioBuffer);
        await audioContext.close();
        resolve(wavBlob);
      } catch (error) {
        await audioContext.close();
        reject(error);
      }
    };

    fileReader.onerror = () => reject(fileReader.error);
    fileReader.readAsArrayBuffer(webmBlob);
  });
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Audio data
  const offset = 44;
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), intSample, true);
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Download audio as WAV file
 */
export async function downloadAsWav(blob: Blob, filename: string = 'beat.wav'): Promise<void> {
  try {
    const wavBlob = await convertToWav(blob);
    downloadAudio(wavBlob, filename);
  } catch (error) {
    console.error('[AudioRecorder] WAV conversion failed, downloading as WebM:', error);
    downloadAudio(blob, filename.replace('.wav', '.webm'));
  }
}
