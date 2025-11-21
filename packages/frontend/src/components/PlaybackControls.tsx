import { useState, useEffect } from 'react';
import { Play, Square, Download, Volume2 } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { executeCode, stopAll, setTempo } from '../services/strudelService';
import { downloadAudio } from '../services/audioRecorder';
import { startRecording, stopRecording } from '../services/audioRecorder';

export default function PlaybackControls() {
  const { currentCode, playback, setPlayback } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const handlePlay = async () => {
    if (!currentCode) return;

    if (playback.isPlaying) {
      // Stop
      await stopAll();
      setPlayback({ isPlaying: false });
    } else {
      // Play
      try {
        await executeCode(currentCode);
        setPlayback({ isPlaying: true });
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

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      try {
        const blob = await stopRecording();
        setRecordedBlob(blob);
        setIsRecording(false);
      } catch (error) {
        console.error('Recording error:', error);
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecording(true);
        setRecordedBlob(null);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const handleDownload = () => {
    if (recordedBlob) {
      downloadAudio(recordedBlob, `kre8-${Date.now()}.webm`);
    }
  };

  if (!currentCode) return null;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Playback Controls</h2>
      
      <div className="space-y-4">
        {/* Play/Stop Button */}
        <div className="flex items-center gap-4">
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

          <button
            onClick={handleRecord}
            className={`btn-secondary flex items-center gap-2 ${
              isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {isRecording ? 'Recording...' : 'Record'}
          </button>

          {recordedBlob && (
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>

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
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

