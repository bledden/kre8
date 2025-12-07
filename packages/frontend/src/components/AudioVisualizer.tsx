import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useAppStore } from '../stores/appStore';
import { getStrudelAudioContext, getAnalyserNode } from '../services/strudelService';

interface AudioVisualizerProps {
  isGenerating?: boolean;
}

export interface AudioVisualizerRef {
  getCanvas: () => HTMLCanvasElement | null;
  getAudioContext: () => AudioContext | null;
}

const AudioVisualizer = forwardRef<AudioVisualizerRef, AudioVisualizerProps>(
  function AudioVisualizer({ isGenerating = false }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [, setIsConnected] = useState(false);
  const { currentCode, playback } = useAppStore();

  // Expose canvas and audio context to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getAudioContext: () => audioContextRef.current,
  }));

  // Set up audio analyser when audio starts playing
  useEffect(() => {
    let mounted = true;

    async function setupAnalyser() {
      if (!playback.isPlaying) {
        setIsConnected(false);
        return;
      }

      try {
        const ctx = await getStrudelAudioContext();
        if (!ctx || !mounted) return;

        // Store audio context for video recording
        audioContextRef.current = ctx;

        // Get the global analyser node that's connected to Strudel's output
        const analyser = await getAnalyserNode();
        if (!analyser || !mounted) {
          console.warn('[AudioVisualizer] Could not get analyser node');
          return;
        }

        analyserRef.current = analyser;
        setIsConnected(true);

        // Start visualization loop
        startVisualization();
        console.log('[AudioVisualizer] Visualization started');
      } catch (error) {
        console.error('[AudioVisualizer] Failed to setup analyser:', error);
      }
    }

    setupAnalyser();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playback.isPlaying]);

  const startVisualization = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgba(15, 15, 15, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Gradient from blue to purple based on frequency
        const hue = 200 + (i / bufferLength) * 60; // 200 (blue) to 260 (purple)
        ctx.fillStyle = `hsl(${hue}, 80%, ${50 + (dataArray[i] / 255) * 30}%)`;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();
  };

  // Draw placeholder visualization when not playing
  const drawPlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw static bars
    const barCount = 32;
    const barWidth = canvas.width / barCount;

    for (let i = 0; i < barCount; i++) {
      // Create a wave pattern
      const height = isGenerating
        ? Math.sin(Date.now() / 200 + i * 0.3) * 30 + 40
        : 20 + Math.sin(i * 0.5) * 10;

      ctx.fillStyle = isGenerating
        ? `hsl(200, 80%, ${40 + Math.sin(Date.now() / 300 + i) * 20}%)`
        : '#1d4ed8';

      ctx.fillRect(
        i * barWidth + 2,
        canvas.height / 2 - height / 2,
        barWidth - 4,
        height
      );
    }
  };

  // Animate placeholder when generating
  useEffect(() => {
    if (isGenerating && !playback.isPlaying) {
      const interval = setInterval(() => {
        drawPlaceholder();
      }, 50);
      return () => clearInterval(interval);
    } else if (!playback.isPlaying) {
      drawPlaceholder();
    }
  }, [isGenerating, playback.isPlaying]);

  // Initial draw
  useEffect(() => {
    drawPlaceholder();
  }, []);

  return (
    <div className="card h-full flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {playback.isPlaying ? 'Now Playing' : isGenerating ? 'Generating...' : 'Visualizer'}
        </h2>
        {playback.isPlaying && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-text-secondary">Live</span>
          </div>
        )}
      </div>

      <div className="flex-1 relative bg-background rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlay info */}
        {currentCode && !playback.isPlaying && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-text-secondary text-sm">Press Play to start</p>
          </div>
        )}

        {!currentCode && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-text-secondary text-sm">Generate a beat to see it here</p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-3 text-xs text-text-secondary">
        {isGenerating
          ? 'AI is composing your beat...'
          : playback.isPlaying
            ? `Playing at ${playback.tempo} BPM`
            : currentCode
              ? 'Pattern ready'
              : 'Awaiting input'}
      </div>
    </div>
  );
});

export default AudioVisualizer;
