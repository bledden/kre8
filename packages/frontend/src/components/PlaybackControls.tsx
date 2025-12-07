import { useState, useEffect, useCallback, RefObject, useRef } from 'react';
import { Play, Square, Download, Circle, Video } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { executeCode, stopAll, setTempo, getAudioDestinationNode } from '../services/strudelService';
import {
  downloadAudio,
  downloadAsWav,
  startStrudelRecording,
  stopRecording,
  getRecordingDuration,
} from '../services/audioRecorder';
import { videoRecorder, downloadVideo } from '../services/videoRecorder';
import { ShareToX } from './ShareToX';
import { AudioVisualizerRef } from './AudioVisualizer';
import { FeedbackModal } from './FeedbackModal';

const RECORD_DURATION_30S = 30000; // 30 seconds in ms

interface PlaybackControlsProps {
  visualizerRef: RefObject<AudioVisualizerRef>;
}

export default function PlaybackControls({ visualizerRef }: PlaybackControlsProps) {
  const { currentCode, playback, setPlayback, conversation } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [autoStopTimeout, setAutoStopTimeout] = useState<NodeJS.Timeout | null>(null);

  // Video recording state
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [videoRecordingTime, setVideoRecordingTime] = useState(0);
  const [videoAutoStopTimeout, setVideoAutoStopTimeout] = useState<NodeJS.Timeout | null>(null);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const playbackStartTimeRef = useRef<number | null>(null);

  // Update recording time display
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(getRecordingDuration());
      }, 100);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Update video recording time display
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecordingVideo) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setVideoRecordingTime(Date.now() - startTime);
      }, 100);
    } else {
      setVideoRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecordingVideo]);

  // Cleanup on unmount and ensure video recorder is stopped
  useEffect(() => {
    // Cancel any ongoing video recording on mount (handles stale state)
    if (videoRecorder.isRecording()) {
      videoRecorder.cancel();
    }

    return () => {
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
      }
      if (videoAutoStopTimeout) {
        clearTimeout(videoAutoStopTimeout);
      }
      // Cancel video recording on unmount
      if (videoRecorder.isRecording()) {
        videoRecorder.cancel();
      }
    };
  }, [autoStopTimeout, videoAutoStopTimeout]);

  const handlePlay = async () => {
    if (!currentCode) return;

    if (playback.isPlaying) {
      await stopAll();
      setPlayback({ isPlaying: false });

      // Show feedback modal after stopping playback
      // Only if user listened for at least 3 seconds
      const listenDuration = playbackStartTimeRef.current
        ? Date.now() - playbackStartTimeRef.current
        : 0;

      if (listenDuration >= 3000) {
        setShowFeedbackModal(true);
      }

      playbackStartTimeRef.current = null;
    } else {
      try {
        await executeCode(currentCode);
        setPlayback({ isPlaying: true });
        playbackStartTimeRef.current = Date.now();
      } catch (error) {
        console.error('Playback error:', error);
      }
    }
  };

  const handleTempoChange = async (newBpm: number) => {
    setPlayback({ tempo: newBpm });
    if (playback.isPlaying) {
      // Convert BPM to CPM for Strudel (assuming 4 beats per cycle)
      // This maintains relative tempo adjustment
      const targetCpm = newBpm / 4;
      await setTempo(targetCpm);
    }
  };

  const stopRecordingAndSave = useCallback(async () => {
    if (autoStopTimeout) {
      clearTimeout(autoStopTimeout);
      setAutoStopTimeout(null);
    }

    try {
      const blob = await stopRecording();
      setRecordedBlob(blob);
      setIsRecording(false);
      console.log('[PlaybackControls] Recording saved:', blob.size, 'bytes');
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  }, [autoStopTimeout]);

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecordingAndSave();
    } else {
      try {
        await startStrudelRecording();
        setIsRecording(true);
        setRecordedBlob(null);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };



  const handleDownload = () => {
    if (recordedBlob) {
      downloadAudio(recordedBlob, `kre8-beat-${Date.now()}.webm`);
    }
  };

  const handleDownloadWav = async () => {
    if (recordedBlob) {
      await downloadAsWav(recordedBlob, `kre8-beat-${Date.now()}.wav`);
    }
  };

  // Video recording functions
  const stopVideoRecordingAndSave = useCallback(async () => {
    if (videoAutoStopTimeout) {
      clearTimeout(videoAutoStopTimeout);
      setVideoAutoStopTimeout(null);
    }

    try {
      const result = await videoRecorder.stop();
      setRecordedVideoBlob(result.blob);
      setIsRecordingVideo(false);
      console.log('[PlaybackControls] Video recording saved:', result.blob.size, 'bytes', result.format);
    } catch (error) {
      console.error('Video recording error:', error);
      setIsRecordingVideo(false);
    }
  }, [videoAutoStopTimeout]);

  const handleRecordVideo30s = async () => {
    if (isRecordingVideo) {
      await stopVideoRecordingAndSave();
      return;
    }

    // Check canvas availability
    const canvas = visualizerRef.current?.getCanvas();
    if (!canvas) {
      console.error('[PlaybackControls] Canvas not available for video recording');
      console.log('[PlaybackControls] visualizerRef.current:', visualizerRef.current);
      return;
    }

    try {
      console.log('[PlaybackControls] Starting video recording...');

      // Make sure music is playing
      if (!playback.isPlaying && currentCode) {
        console.log('[PlaybackControls] Starting playback for recording...');
        await executeCode(currentCode);
        setPlayback({ isPlaying: true });
        // Small delay to let audio start
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Get audio destination for capturing Strudel audio
      const audioDestination = await getAudioDestinationNode();
      console.log('[PlaybackControls] Audio destination:', audioDestination ? 'available' : 'not available');

      // Start video recording with canvas visuals + Strudel audio
      videoRecorder.start({
        canvas,
        audioDestination: audioDestination || undefined,
      });

      setIsRecordingVideo(true);
      setRecordedVideoBlob(null);

      // Auto-stop after 30 seconds
      const timeout = setTimeout(async () => {
        if (videoRecorder.isRecording()) {
          await stopVideoRecordingAndSave();
        }
      }, RECORD_DURATION_30S);

      setVideoAutoStopTimeout(timeout);
      console.log('[PlaybackControls] Video recording started, will auto-stop in 30s');
    } catch (error) {
      console.error('[PlaybackControls] Failed to start video recording:', error);
      setIsRecordingVideo(false);
    }
  };

  const handleDownloadVideo = () => {
    if (recordedVideoBlob) {
      downloadVideo(recordedVideoBlob, `kre8-beat-${Date.now()}`);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const remaining = Math.floor((RECORD_DURATION_30S - ms) / 1000);
    if (autoStopTimeout) {
      return `${remaining}s`;
    }
    return `${seconds}s`;
  };

  const formatVideoTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const remaining = Math.floor((RECORD_DURATION_30S - ms) / 1000);
    if (videoAutoStopTimeout) {
      return `${remaining}s`;
    }
    return `${seconds}s`;
  };

  // Get the last user prompt from conversation for feedback
  const getLastUserPrompt = (): string => {
    const userMessages = conversation.filter((m) => m.role === 'user');
    return userMessages[userMessages.length - 1]?.content || 'Music generation';
  };

  // Calculate listen duration for feedback
  const getListenDuration = (): number => {
    return playbackStartTimeRef.current
      ? Date.now() - playbackStartTimeRef.current
      : 0;
  };

  if (!currentCode) return null;

  return (
    <>
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Playback</h2>

      <div className="space-y-4">
        {/* Play/Stop Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePlay}
            className={`btn-primary flex items-center gap-2 ${
              playback.isPlaying ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
          >
            {playback.isPlaying ? (
              <>
                <Square className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </button>

          {/* Record Button */}
          <button
            onClick={handleRecord}
            className={`btn-secondary flex items-center gap-2 ${
              isRecording && !autoStopTimeout ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''
            }`}
          >
            <Circle className={`w-4 h-4 ${isRecording && !autoStopTimeout ? 'animate-pulse fill-current' : ''}`} />
            {isRecording && !autoStopTimeout ? formatTime(recordingTime) : 'Record'}
          </button>



          {/* 30s Video Record Button */}
          <button
            onClick={handleRecordVideo30s}
            className={`btn-secondary flex items-center gap-2 ${
              isRecordingVideo ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' : ''
            }`}
            title={isRecordingVideo ? 'Click to stop recording' : 'Record 30 second video with visualizer for X'}
          >
            <Video className={`w-4 h-4 ${isRecordingVideo ? 'animate-pulse' : ''}`} />
            {isRecordingVideo ? formatVideoTime(videoRecordingTime) : '30s Video'}
          </button>
        </div>

        {/* Audio Download Options */}
        {recordedBlob && (
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border-primary">
            <span className="text-sm text-text-secondary">
              Audio ready ({(recordedBlob.size / 1024).toFixed(1)} KB)
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center gap-2 text-sm py-1 px-3"
              >
                <Download className="w-3 h-3" />
                WebM
              </button>
              <button
                onClick={handleDownloadWav}
                className="btn-secondary flex items-center gap-2 text-sm py-1 px-3"
              >
                <Download className="w-3 h-3" />
                WAV
              </button>
            </div>
          </div>
        )}

        {/* Video Download Options */}
        {recordedVideoBlob && (
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-purple-500/30">
            <span className="text-sm text-text-secondary">
              Video ready ({(recordedVideoBlob.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleDownloadVideo}
                className="btn-secondary flex items-center gap-2 text-sm py-1 px-3"
              >
                <Download className="w-3 h-3" />
                Video
              </button>
              <ShareToX code={currentCode.code} videoBlob={recordedVideoBlob} />
            </div>
          </div>
        )}

        {/* Tempo Control */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tempo: {playback.tempo} BPM
          </label>
          <input
            type="range"
            min="60"
            max="200"
            value={playback.tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            className="w-full accent-x-blue"
          />
        </div>
      </div>
    </div>

    {/* Feedback Modal */}
    <FeedbackModal
      isOpen={showFeedbackModal}
      onClose={() => setShowFeedbackModal(false)}
      code={currentCode}
      prompt={getLastUserPrompt()}
      listenDurationMs={getListenDuration()}
    />
    </>
  );
}
