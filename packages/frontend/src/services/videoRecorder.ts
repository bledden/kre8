/**
 * Video Recorder Service
 * Captures canvas visuals + audio and exports as video for X sharing
 */

export interface VideoRecorderOptions {
  canvas: HTMLCanvasElement;
  audioContext?: AudioContext;
  audioDestination?: MediaStreamAudioDestinationNode;
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export interface RecordingResult {
  blob: Blob;
  duration: number;
  format: string;
}

class VideoRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private combinedStream: MediaStream | null = null;

  /**
   * Check if video recording is supported
   */
  isSupported(): boolean {
    return !!(
      typeof MediaRecorder !== 'undefined' &&
      HTMLCanvasElement.prototype.captureStream
    );
  }

  /**
   * Get supported MIME types for recording
   */
  getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }

  /**
   * Start recording canvas + audio
   */
  start(options: VideoRecorderOptions): void {
    if (!this.isSupported()) {
      throw new Error('Video recording not supported in this browser');
    }

    const {
      canvas,
      audioDestination,
      mimeType,
      videoBitsPerSecond = 2500000, // 2.5 Mbps
      audioBitsPerSecond = 128000,  // 128 kbps
    } = options;

    // Capture canvas stream at 30fps
    const canvasStream = canvas.captureStream(30);

    // Combine video and audio streams if audio is available
    if (audioDestination) {
      const audioStream = audioDestination.stream;
      const audioTracks = audioStream.getAudioTracks();

      // Create combined stream
      this.combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);
    } else {
      this.combinedStream = canvasStream;
    }

    // Determine best MIME type
    const supportedTypes = this.getSupportedMimeTypes();
    const selectedMimeType = mimeType && MediaRecorder.isTypeSupported(mimeType)
      ? mimeType
      : supportedTypes[0];

    if (!selectedMimeType) {
      throw new Error('No supported video format found');
    }

    // Create MediaRecorder
    this.mediaRecorder = new MediaRecorder(this.combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond,
      audioBitsPerSecond,
    });

    this.chunks = [];
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Start recording with 1-second chunks for smoother processing
    this.mediaRecorder.start(1000);

    console.log('[VideoRecorder] Recording started with:', selectedMimeType);
  }

  /**
   * Stop recording and return the video blob
   */
  stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });

        // Determine format from mime type
        const format = mimeType.includes('mp4') ? 'mp4' : 'webm';

        console.log('[VideoRecorder] Recording stopped:', {
          duration: `${duration.toFixed(1)}s`,
          size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          format,
        });

        // Cleanup
        this.cleanup();

        resolve({ blob, duration, format });
      };

      this.mediaRecorder.onerror = (event) => {
        this.cleanup();
        reject(new Error(`Recording error: ${event}`));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Get current recording duration in seconds
   */
  getCurrentDuration(): number {
    if (!this.isRecording()) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('[VideoRecorder] Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('[VideoRecorder] Recording resumed');
    }
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    console.log('[VideoRecorder] Recording cancelled');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop all tracks in the combined stream
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach(track => track.stop());
    }

    this.mediaRecorder = null;
    this.chunks = [];
    this.combinedStream = null;
  }
}

// Singleton instance
export const videoRecorder = new VideoRecorderService();

/**
 * Create an audio destination node for routing Strudel audio
 * This allows us to capture the audio output
 */
export function createAudioCapture(audioContext: AudioContext): MediaStreamAudioDestinationNode {
  return audioContext.createMediaStreamDestination();
}

/**
 * Download a video blob as a file
 */
export function downloadVideo(blob: Blob, filename: string = 'kre8-beat'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert webm to a format string for display
 */
export function getVideoFormatDisplay(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'MP4';
  if (mimeType.includes('webm')) return 'WebM';
  return 'Video';
}
