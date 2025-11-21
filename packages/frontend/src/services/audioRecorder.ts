/**
 * Audio recording service using MediaRecorder API
 */

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;

/**
 * Start recording audio from microphone
 */
export async function startRecording(): Promise<void> {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Failed to start recording:', error);
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
      mediaRecorder = null;
      audioChunks = [];

      resolve(audioBlob);
    };

    mediaRecorder.onerror = (error) => {
      reject(error);
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

