import { useCallback, useRef } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import CodePanel from './components/CodePanel';
import PlaybackControls from './components/PlaybackControls';
import AudioVisualizer, { AudioVisualizerRef } from './components/AudioVisualizer';
import PresetGallery from './components/PresetGallery';
import VocalGenerator from './components/VocalGenerator';
import LayerPanel from './components/LayerPanel';
import { useAppStore } from './stores/appStore';
import { loadVocalSample } from './services/strudelService';

interface VocalSample {
  id: string;
  text: string;
  dataUrl: string;
  name: string;
}

function App() {
  const { currentCode, error, isLoading } = useAppStore();
  const visualizerRef = useRef<AudioVisualizerRef>(null);

  // Handle new vocal samples being generated
  const handleVocalGenerated = useCallback(async (sample: VocalSample) => {
    try {
      await loadVocalSample({
        id: sample.id,
        dataUrl: sample.dataUrl,
        name: sample.name,
      });
      console.log('[App] Vocal sample loaded into Strudel:', sample.name);
    } catch (err) {
      console.error('[App] Failed to load vocal sample:', err);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <InputPanel />
            <PresetGallery />
            <LayerPanel />
            <VocalGenerator onSampleGenerated={handleVocalGenerated} />
            {error && (
              <div className="card bg-red-900/20 border-red-700">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Visualization & Playback */}
          <div className="space-y-6">
            {currentCode && <PlaybackControls visualizerRef={visualizerRef} />}
            <AudioVisualizer ref={visualizerRef} isGenerating={isLoading} />
            <CodePanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
