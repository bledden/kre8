import { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, AlertCircle, Check, X, Plus, Trash2, Music } from 'lucide-react';
import { voiceApi, VoicePreset } from '../services/api';

interface VocalSample {
  id: string;
  text: string;
  dataUrl: string;
  name: string;
}

interface VocalGeneratorProps {
  onSampleGenerated: (sample: VocalSample) => void;
  onSamplesChange?: (samples: VocalSample[]) => void;
}

export default function VocalGenerator({ onSampleGenerated, onSamplesChange }: VocalGeneratorProps) {
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice generation state
  const [vocalText, setVocalText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset | null>(null);
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consent state
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Generated samples
  const [generatedSamples, setGeneratedSamples] = useState<VocalSample[]>([]);

  // Preview audio
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Notify parent of samples changes
  useEffect(() => {
    onSamplesChange?.(generatedSamples);
  }, [generatedSamples, onSamplesChange]);

  async function loadPresets() {
    try {
      const loadedPresets = await voiceApi.getPresets();
      setPresets(loadedPresets);
      if (loadedPresets.length > 0) {
        setSelectedPreset(loadedPresets[0]);
      }
    } catch (err) {
      console.error('Failed to load voice presets:', err);
    }
  }

  // Recording functions
  async function startRecording() {
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
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function clearRecording() {
    setRecordedBlob(null);
    setRecordingDuration(0);
    setConsentConfirmed(false);
  }

  // Preview recorded audio
  function playPreview() {
    if (recordedBlob && audioPreviewRef.current) {
      audioPreviewRef.current.src = URL.createObjectURL(recordedBlob);
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  }

  function stopPreview() {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
      setIsPlayingPreview(false);
    }
  }

  // Generate vocal sample
  async function handleGenerate() {
    if (!vocalText.trim()) {
      setError('Please enter text for the vocal');
      return;
    }

    if (recordedBlob && !consentConfirmed) {
      setShowConsentModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await voiceApi.generateVocalSample(
        vocalText,
        recordedBlob || undefined,
        selectedPreset?.instructions,
        consentConfirmed
      );

      const newSample: VocalSample = {
        id: `vocal-${Date.now()}`,
        text: vocalText,
        dataUrl: result.dataUrl,
        name: vocalText.slice(0, 20) + (vocalText.length > 20 ? '...' : ''),
      };

      setGeneratedSamples(prev => [...prev, newSample]);
      onSampleGenerated(newSample);
      setVocalText('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate vocal';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleConsentConfirm() {
    setConsentConfirmed(true);
    setShowConsentModal(false);
    // Re-trigger generation
    handleGenerate();
  }

  function removeSample(id: string) {
    setGeneratedSamples(prev => prev.filter(s => s.id !== id));
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-accent-primary" />
        <h3 className="text-lg font-semibold text-text-primary">Voice Loop</h3>
      </div>

      {/* Voice Recording Section */}
      <div className="bg-background rounded-lg p-4 border border-border-primary">
        <p className="text-sm text-text-secondary mb-3">
          Record your voice to clone it, or use a preset voice style
        </p>

        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
            >
              <Mic className="w-4 h-4" />
              Record Voice
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full animate-pulse"
            >
              <Square className="w-4 h-4" />
              Stop ({formatDuration(recordingDuration)})
            </button>
          )}

          {recordedBlob && !isRecording && (
            <>
              <button
                onClick={isPlayingPreview ? stopPreview : playPreview}
                className="p-2 bg-accent-primary/20 text-accent-primary rounded-full hover:bg-accent-primary/30"
              >
                {isPlayingPreview ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="text-sm text-text-secondary">
                {formatDuration(recordingDuration)} recorded
              </span>
              <button
                onClick={clearRecording}
                className="p-2 text-text-secondary hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {recordedBlob && (
          <div className="mt-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Voice sample ready for cloning</span>
          </div>
        )}

        <audio ref={audioPreviewRef} onEnded={() => setIsPlayingPreview(false)} className="hidden" />
      </div>

      {/* Voice Preset Selection */}
      {!recordedBlob && (
        <div>
          <label className="block text-sm text-text-secondary mb-2">Voice Style</label>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedPreset?.id === preset.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-card text-text-secondary hover:bg-card-hover border border-border-primary'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vocal Text Input */}
      <div>
        <label className="block text-sm text-text-secondary mb-2">
          What should the voice say? (max 500 chars)
        </label>
        <textarea
          value={vocalText}
          onChange={(e) => setVocalText(e.target.value.slice(0, 500))}
          placeholder="Enter lyrics, ad-libs, or vocal phrases..."
          className="w-full h-20 bg-background text-text-primary rounded-lg p-3 resize-none border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          maxLength={500}
        />
        <div className="text-right text-xs text-text-secondary mt-1">
          {vocalText.length}/500
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !vocalText.trim()}
        className="w-full py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Vocal...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Generate Vocal Sample
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

      {/* Generated Samples List */}
      {generatedSamples.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">Generated Vocals</h4>
          <div className="space-y-2">
            {generatedSamples.map(sample => (
              <div
                key={sample.id}
                className="flex items-center justify-between bg-background rounded-lg p-2 border border-border-primary"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-accent-primary" />
                  <span className="text-sm text-text-primary">{sample.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <audio src={sample.dataUrl} controls className="h-8 w-32" />
                  <button
                    onClick={() => removeSample(sample.id)}
                    className="p-1 text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Use <code className="bg-card px-1 rounded">s("vocal")</code> in your Strudel code to play these samples
          </p>
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
              You are about to use a voice recording for AI voice cloning. Please confirm:
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>This is my own voice, OR I have explicit permission from the person whose voice was recorded</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>I will not use this to impersonate someone without their consent</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>I understand that misuse of voice cloning technology may violate laws and platform policies</span>
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
