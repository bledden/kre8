import { Play } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { executeCode, setPatternBaseTempo } from '../services/strudelService';
import type { StrudelCode } from '@kre8/shared';

interface Preset {
  name: string;
  genre: string;
  code: string;
  bpm: number;
  color: string;
}

// Pre-validated Strudel patterns from few_shot_examples.json
const PRESETS: Preset[] = [
  {
    name: 'Chill Lo-fi',
    genre: 'lo-fi',
    code: 'stack(s("bd ~ bd ~").gain(0.7), s("~ sd ~ ~").gain(0.5).room(0.5), s("hh hh hh hh").gain(0.25).cutoff(2000)).slow(2).cutoff(1800).room(0.4).cpm(85)',
    bpm: 85,
    color: 'from-purple-500 to-orange-400',
  },
  {
    name: 'Hard Techno',
    genre: 'techno',
    code: 'stack(s("bd*4").gain(0.9), s("~ ~ cp ~").gain(0.7), s("hh*8").gain(0.45), n("0 0 3 0 5 0 7 5").s("square").octave(2).cutoff(1200).resonance(0.4).gain(0.7)).cpm(135)',
    bpm: 135,
    color: 'from-blue-600 to-cyan-400',
  },
  {
    name: 'Trap Beat',
    genre: 'trap',
    code: 'stack(s("bd ~ ~ ~ bd ~ ~ bd").gain(0.95), s("~ ~ cp ~ ~ ~ cp ~").gain(0.85).delay(0.25), s("hh*2 hh*2 hh*4 hh*8").fast(2).gain(0.6), n("0 ~ ~ 3").s("bass").octave(2).gain(0.9)).cpm(140)',
    bpm: 140,
    color: 'from-red-500 to-yellow-500',
  },
  {
    name: 'Deep House',
    genre: 'house',
    code: 'stack(s("bd*4").gain(0.8), s("~ cp ~ cp").gain(0.6).room(0.4), s("[~ hh]*4").gain(0.4), note("<[c3,e3,g3] [a2,c3,e3]>").s("sine").gain(0.5).cutoff(600).room(0.5).slow(2)).cpm(122)',
    bpm: 122,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Ambient Drone',
    genre: 'ambient',
    code: 'stack(n("c4 e4 g4 a4 c5 a4 g4 e4").s("sine").slow(4).gain(0.5).delay(0.5).delaytime(0.375).delayfeedback(0.6), n("c2").s("sine").cutoff(200).gain(0.4).room(0.9), s("~ ~ ~ bd").gain(0.25).delay(0.75)).cpm(50)',
    bpm: 50,
    color: 'from-green-500 to-teal-400',
  },
  {
    name: 'Drum & Bass',
    genre: 'dnb',
    code: 'stack(s("bd ~ ~ bd sd ~ bd ~").fast(2).gain(0.9), s("hh*8").gain(0.5), n("0 ~ ~ 0").s("square").octave(1).cutoff(250).gain(0.85)).cpm(174)',
    bpm: 174,
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Synthwave',
    genre: 'synthwave',
    code: 'stack(s("bd ~ sd ~").gain(0.85), s("hh*4").gain(0.4), note("c4 e4 g4 b4 c5 b4 g4 e4").s("sine").gain(0.5).cutoff(1800).room(0.4), note("<[c3,e3,g3] [a2,c3,e3] [f3,a3,c4] [g3,b3,d4]>").s("sine").gain(0.4).slow(2)).cpm(110)',
    bpm: 110,
    color: 'from-pink-500 to-purple-600',
  },
  {
    name: 'Minimal Techno',
    genre: 'minimal',
    code: 'stack(s("bd*4").gain(0.85), s("~ [~ cp] ~ ~").gain(0.6), s("hh*8").gain(0.35).degradeBy(0.2)).cpm(128)',
    bpm: 128,
    color: 'from-gray-600 to-gray-400',
  },
];

export default function PresetGallery() {
  const { setCurrentCode, setPlayback, setLoading, addMessage } = useAppStore();

  const handlePresetClick = async (preset: Preset) => {
    setLoading(true);

    try {
      const strudelCode: StrudelCode = {
        code: preset.code,
        explanation: `${preset.name} - ${preset.genre} at ${preset.bpm} BPM`,
        metadata: {
          tempo: preset.bpm,
          instruments: [],
        },
      };

      // Add to conversation
      addMessage({
        role: 'user',
        content: `Play preset: ${preset.name}`,
        timestamp: new Date(),
      });

      addMessage({
        role: 'assistant',
        content: preset.code,
        timestamp: new Date(),
      });

      // Set code and play
      setCurrentCode(strudelCode);
      setPatternBaseTempo(preset.bpm); // Set base tempo for relative tempo adjustments
      await executeCode(strudelCode);
      setPlayback({ isPlaying: true, tempo: preset.bpm });
    } catch (error) {
      console.error('Failed to play preset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
      <p className="text-sm text-text-secondary mb-4">
        Try a preset beat or create your own
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset)}
            className={`group relative p-3 rounded-lg bg-gradient-to-br ${preset.color} hover:scale-[1.02] transition-transform`}
          >
            <div className="absolute inset-0 bg-black/40 rounded-lg group-hover:bg-black/30 transition-colors" />
            <div className="relative flex flex-col items-center text-center">
              <Play className="w-6 h-6 mb-1 opacity-80 group-hover:opacity-100" />
              <span className="text-xs font-medium text-white">{preset.name}</span>
              <span className="text-[10px] text-white/70">{preset.bpm} BPM</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
