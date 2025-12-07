import { useState, useEffect, useCallback, RefObject, useRef } from 'react';
import { Play, Square, Download, Circle, Clock, Video } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { executeCode, stopAll, setTempo } from '../services/strudelService';
import {
  downloadAudio,
  downloadAsWav,
  startStrudelRecording,
  stopRecording,
  isRecording as checkIsRecording,
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
      }
      if (videoAutoStopTimeout) {
        clearTimeout(videoAutoStopTimeout);
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

  const handleTempoChange = async (newTempo: number) => {
    setPlayback({ tempo: newTempo });
    if (playback.isPlaying) {
      await setTempo(newTempo);
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

  const handleRecord30s = async () => {
    if (isRecording) {
      await stopRecordingAndSave();
    } else {
      try {
        // Make sure music is playing
        if (!playback.isPlaying && currentCode) {
          await executeCode(currentCode);
          setPlayback({ isPlaying: true });
        }

        await startStrudelRecording();
        setIsRecording(true);
        setRecordedBlob(null);

        // Auto-stop after 30 seconds
        const timeout = setTimeout(async () => {
          if (checkIsRecording()) {
            await stopRecordingAndSave();
          }
        }, RECORD_DURATION_30S);

        setAutoStopTimeout(timeout);
      } catch (error) {
        console.error('Failed to start 30s recording:', error);
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
    } else {
      const canvas = visualizerRef.current?.getCanvas();
      if (!canvas) {
        console.error('Canvas not available for video recording');
        return;
      }

      try {
        // Make sure music is playing
        if (!playback.isPlaying && currentCode) {
          await executeCode(currentCode);
          setPlayback({ isPlaying: true });
        }

        // Start video recording
        videoRecorder.start({ canvas });

        setIsRecordingVideo(true);
        setRecordedVideoBlob(null);

        // Auto-stop after 30 seconds
        const timeout = setTimeout(async () => {
          if (videoRecorder.isRecording()) {
            await stopVideoRecordingAndSave();
          }
        }, RECORD_DURATION_30S);

        setVideoAutoStopTimeout(timeout);
      } catch (error) {
        console.error('Failed to start video recording:', error);
      }
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

          {/* 30s Record Button */}
          <button
            onClick={handleRecord30s}
            disabled={isRecording && !autoStopTimeout}
            className={`btn-secondary flex items-center gap-2 ${
              isRecording && autoStopTimeout ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''
            }`}
            title="Record 30 seconds for sharing"
          >
            <Clock className={`w-4 h-4 ${isRecording && autoStopTimeout ? 'animate-pulse' : ''}`} />
            {isRecording && autoStopTimeout ? formatTime(recordingTime) : '30s Clip'}
          </button>

          {/* 30s Video Record Button */}
          <button
            onClick={handleRecordVideo30s}
            disabled={isRecordingVideo && !videoAutoStopTimeout}
            className={`btn-secondary flex items-center gap-2 ${
              isRecordingVideo ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' : ''
            }`}
            title="Record 30 second video with visualizer for X"
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
