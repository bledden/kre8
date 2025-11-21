import { useState, useRef } from 'react';
import { Mic, Upload, Send, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { musicApi, transcriptionApi } from '../services/api';
import { startRecording, stopRecording } from '../services/audioRecorder';
import { executeCode } from '../services/strudelService';

export default function InputPanel() {
  const [prompt, setPrompt] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentCode, setLoading, setError, addMessage, currentCode } = useAppStore();

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isRecordingAudio) return;

    setLoading(true);
    setError(undefined);

    try {
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      });

      // Generate code
      const result = await musicApi.generate({
        prompt,
        conversationHistory: useAppStore.getState().conversation,
        refinement: !!currentCode,
      });

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: result.code,
        timestamp: new Date(),
      });

      // Set current code and execute
      setCurrentCode(result);
      await executeCode(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate music');
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecordingAudio) {
      // Stop recording
      try {
        const audioBlob = await stopRecording();
        setIsRecordingAudio(false);
        setLoading(true);

        // Transcribe
        const transcription = await transcriptionApi.transcribe(audioBlob);
        
        // Use transcribed text as prompt
        setPrompt(transcription.text);
        
        // Auto-submit
        setTimeout(() => {
          handleTextSubmit(new Event('submit') as any);
        }, 100);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
        setIsRecordingAudio(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecordingAudio(true);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Microphone access denied');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Assume it's an audio file for transcription
      const transcription = await transcriptionApi.transcribe(file);
      setPrompt(transcription.text);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const { isLoading } = useAppStore();

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Create Music</h2>
      
      <form onSubmit={handleTextSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the music you want to create... (e.g., 'Create a fast techno beat with hi-hats')"
            className="input-field w-full h-32 resize-none"
            disabled={isLoading || isRecordingAudio}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleVoiceRecord}
            disabled={isLoading}
            className={`btn-secondary flex items-center gap-2 ${
              isRecordingAudio ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''
            }`}
          >
            <Mic className="w-4 h-4" />
            {isRecordingAudio ? 'Recording...' : 'Voice'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecordingAudio}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || isRecordingAudio}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

