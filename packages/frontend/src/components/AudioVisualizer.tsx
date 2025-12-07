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
    let hueOffset = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Calculate average for glow intensity
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const intensity = average / 255;

      // Dynamic background with glow
      ctx.fillStyle = `rgba(10, 10, 15, 0.15)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating hue for rainbow effect
      hueOffset = (hueOffset + 0.5) % 360;

      // Draw mirrored spectrum bars
      const barCount = 64;
      const barWidth = canvas.width / barCount;
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = value * centerY * 0.9;

        // Rainbow gradient with rotation
        const hue = (hueOffset + (i / barCount) * 180) % 360;
        const saturation = 80 + value * 20;
        const lightness = 45 + value * 35;

        // Glow effect
        ctx.shadowBlur = 15 * value;
        ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        // Draw mirrored bars from center
        const x = i * barWidth;
        ctx.fillRect(x + 1, centerY - barHeight, barWidth - 2, barHeight); // Top
        ctx.fillRect(x + 1, centerY, barWidth - 2, barHeight); // Bottom
      }

      // Add center glow line
      ctx.shadowBlur = 20 * intensity;
      ctx.shadowColor = `hsl(${hueOffset}, 100%, 60%)`;
      ctx.fillStyle = `hsl(${hueOffset}, 100%, ${50 + intensity * 30}%)`;
      ctx.fillRect(0, centerY - 1, canvas.width, 2);

      // Reset shadow
      ctx.shadowBlur = 0;
    };

    draw();
  };

  // Draw placeholder visualization when not playing
  const drawPlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(10, 10, 15, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barCount = 64;
    const barWidth = canvas.width / barCount;
    const centerY = canvas.height / 2;
    const time = Date.now() / 1000;

    for (let i = 0; i < barCount; i++) {
      // Create animated wave pattern when generating
      const waveHeight = isGenerating
        ? Math.sin(time * 3 + i * 0.15) * 25 + Math.sin(time * 5 + i * 0.3) * 15
        : 8 + Math.sin(i * 0.3) * 4;

      const hue = isGenerating
        ? (time * 50 + (i / barCount) * 180) % 360
        : 220;

      const lightness = isGenerating
        ? 45 + Math.sin(time * 4 + i * 0.2) * 20
        : 30;

      ctx.shadowBlur = isGenerating ? 10 : 0;
      ctx.shadowColor = `hsl(${hue}, 80%, ${lightness}%)`;
      ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;

      // Draw mirrored bars from center
      const x = i * barWidth;
      ctx.fillRect(x + 1, centerY - waveHeight, barWidth - 2, waveHeight);
      ctx.fillRect(x + 1, centerY, barWidth - 2, waveHeight);
    }

    // Center line
    ctx.shadowBlur = isGenerating ? 15 : 5;
    ctx.shadowColor = isGenerating ? `hsl(${(time * 50) % 360}, 100%, 60%)` : '#1d4ed8';
    ctx.fillStyle = isGenerating ? `hsl(${(time * 50) % 360}, 100%, 60%)` : '#1d4ed8';
    ctx.fillRect(0, centerY - 1, canvas.width, 2);

    ctx.shadowBlur = 0;
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
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-text-primary">
          {playback.isPlaying ? 'Now Playing' : isGenerating ? 'Generating...' : 'Visualizer'}
        </h2>
        {playback.isPlaying && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-text-secondary">Live</span>
          </div>
        )}
      </div>

      <div className="relative bg-background rounded overflow-hidden" style={{ height: '120px' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Overlay info */}
        {currentCode && !playback.isPlaying && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-text-secondary text-xs">Press Play to start</p>
          </div>
        )}

        {!currentCode && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-text-secondary text-xs">Generate a beat to see it here</p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-2 text-xs text-text-secondary">
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
