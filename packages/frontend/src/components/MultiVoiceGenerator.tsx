import { useState, useRef, useEffect } from 'react';
import { Users, Plus, Trash2, Play, Square, Mic, AlertCircle, Check, AudioWaveform } from 'lucide-react';
import { voiceApi, VoicePreset } from '../services/api';

interface VoiceTrack {
  id: string;
  name: string;
  sample?: Blob;
  instructions?: string;
  text: string;
}

interface MultiVoiceGeneratorProps {
  onAudioGenerated: (audioBlob: Blob) => void;
}

export default function MultiVoiceGenerator({ onAudioGenerated }: MultiVoiceGeneratorProps) {
  const [tracks, setTracks] = useState<VoiceTrack[]>([
    { id: 'voice-1', name: 'Voice 1', text: '' },
  ]);
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null);

  // Recording state per track
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      const loadedPresets = await voiceApi.getPresets();
      setPresets(loadedPresets);
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  }

  function addTrack() {
    if (tracks.length >= 4) {
      setError('Maximum 4 voices allowed');
      return;
    }
    const newId = `voice-${Date.now()}`;
    setTracks([...tracks, { id: newId, name: `Voice ${tracks.length + 1}`, text: '' }]);
  }

  function removeTrack(id: string) {
    if (tracks.length <= 1) return;
    setTracks(tracks.filter(t => t.id !== id));
  }

  function updateTrack(id: string, updates: Partial<VoiceTrack>) {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  // Recording for a specific track
  async function startRecording(trackId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        updateTrack(trackId, { sample: blob });
        stream.getTracks().forEach(track => track.stop());
        setRecordingTrackId(null);
      };

      mediaRecorder.start();
      setRecordingTrackId(trackId);
    } catch (err) {
      setError('Could not access microphone');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recordingTrackId) {
      mediaRecorderRef.current.stop();
    }
  }

  async function handleGenerate() {
    // Check if any track has a voice sample
    const hasVoiceSamples = tracks.some(t => t.sample);
    if (hasVoiceSamples && !consentConfirmed) {
      setShowConsentModal(true);
      return;
    }

    // Validate all tracks have text
    const emptyTracks = tracks.filter(t => !t.text.trim());
    if (emptyTracks.length > 0) {
      setError('All voices need text to say');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Build voices array
      const voices = tracks.map(t => ({
        id: t.id,
        sample: t.sample,
        instructions: t.instructions,
      }));

      // Build script - each voice says their text in sequence
      const script = tracks.map(t => ({
        speakerId: t.id,
        text: t.text,
      }));

      const audioBlob = await voiceApi.generateMultiVoice(voices, script, consentConfirmed);
      setGeneratedAudio(audioBlob);
      onAudioGenerated(audioBlob);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate multi-voice audio';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleConsentConfirm() {
    setConsentConfirmed(true);
    setShowConsentModal(false);
    handleGenerate();
  }

  function playPreview() {
    if (generatedAudio && audioPreviewRef.current) {
      audioPreviewRef.current.src = URL.createObjectURL(generatedAudio);
      audioPreviewRef.current.play();
      setIsPlaying(true);
    }
  }

  function stopPreview() {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Multi-Voice</h3>
        </div>
        <button
          onClick={addTrack}
          disabled={tracks.length >= 4}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-accent-primary/20 text-accent-primary rounded-full hover:bg-accent-primary/30 disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
          Add Voice
        </button>
      </div>

      <p className="text-sm text-text-secondary">
        Create layered vocals with multiple voices speaking in sequence
      </p>

      {/* Voice Tracks */}
      <div className="space-y-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-background rounded-lg p-3 border border-border-primary"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                {track.name}
              </span>
              <div className="flex items-center gap-2">
                {/* Record button */}
                {recordingTrackId === track.id ? (
                  <button
                    onClick={stopRecording}
                    className="p-1.5 bg-red-500 text-white rounded-full animate-pulse"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => startRecording(track.id)}
                    className="p-1.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30"
                    title="Record voice sample"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                )}

                {/* Remove button */}
                {tracks.length > 1 && (
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="p-1.5 text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Voice sample indicator */}
            {track.sample && (
              <div className="flex items-center gap-1 mb-2 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Voice sample recorded
              </div>
            )}

            {/* Voice preset or custom */}
            <select
              value={track.instructions || ''}
              onChange={(e) => updateTrack(track.id, { instructions: e.target.value })}
              className="w-full mb-2 px-2 py-1 text-sm bg-card text-text-primary rounded border border-border-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="">Select voice style...</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.instructions}>
                  {preset.name}
                </option>
              ))}
            </select>

            {/* Text input */}
            <textarea
              value={track.text}
              onChange={(e) => updateTrack(track.id, { text: e.target.value.slice(0, 200) })}
              placeholder={`What should ${track.name} say?`}
              className="w-full h-16 text-sm bg-card text-text-primary rounded p-2 resize-none border border-border-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              maxLength={200}
            />
            <div className="text-right text-xs text-text-secondary">
              {track.text.length}/200
            </div>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || tracks.every(t => !t.text.trim())}
        className="w-full py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Multi-Voice...
          </>
        ) : (
          <>
            <AudioWaveform className="w-4 h-4" />
            Generate Layered Vocals
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Generated Audio Preview */}
      {generatedAudio && (
        <div className="flex items-center gap-3 bg-background rounded-lg p-3 border border-border-primary">
          <button
            onClick={isPlaying ? stopPreview : playPreview}
            className="p-2 bg-accent-primary/20 text-accent-primary rounded-full hover:bg-accent-primary/30"
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1">
            <span className="text-sm text-text-primary">Multi-voice audio ready</span>
            <p className="text-xs text-text-secondary">{tracks.length} voices</p>
          </div>
          <audio ref={audioPreviewRef} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-border-primary">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-text-primary">Voice Cloning Consent</h3>
            </div>

            <p className="text-text-secondary mb-4">
              You are using voice recordings for AI voice cloning. Please confirm:
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>All recorded voices are my own OR I have explicit permission from each person</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>I will not use this to impersonate anyone without consent</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>I understand misuse may violate laws and policies</span>
              </li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2 bg-border-primary text-text-primary rounded-lg hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleConsentConfirm}
                className="flex-1 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90"
              >
                I Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
