import { Volume2, VolumeX, Trash2, Layers } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { executeLayers } from '../services/strudelService';

export default function LayerPanel() {
  const { layers, toggleLayerMute, removeLayer, clearLayers, playback, setPlayback } = useAppStore();

  if (layers.length === 0) {
    return null;
  }

  const handleToggleMute = async (id: string) => {
    toggleLayerMute(id);
    // Re-execute with updated mute states
    const updatedLayers = layers.map((l) =>
      l.id === id ? { ...l, muted: !l.muted } : l
    );
    await executeLayers(updatedLayers, playback.tempo);
  };

  const handleRemoveLayer = async (id: string) => {
    removeLayer(id);
    const remainingLayers = layers.filter((l) => l.id !== id);
    if (remainingLayers.length > 0) {
      await executeLayers(remainingLayers, playback.tempo);
    } else {
      setPlayback({ isPlaying: false });
    }
  };

  const handleClearAll = async () => {
    clearLayers();
    setPlayback({ isPlaying: false });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-medium">Active Layers</h3>
          <span className="text-xs text-text-secondary">({layers.length})</span>
        </div>
        <button
          onClick={handleClearAll}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              layer.muted
                ? 'bg-surface-elevated/50 opacity-50'
                : 'bg-surface-elevated'
            }`}
          >
            <span className="text-xs text-text-secondary w-4">{index + 1}</span>

            <button
              onClick={() => handleToggleMute(layer.id)}
              className={`p-1 rounded transition-colors ${
                layer.muted
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-green-400 hover:text-green-300'
              }`}
              title={layer.muted ? 'Unmute' : 'Mute'}
            >
              {layer.muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" title={layer.name}>
                {layer.name}
              </p>
              <p className="text-xs text-text-secondary font-mono truncate" title={layer.code}>
                {layer.code.slice(0, 40)}...
              </p>
            </div>

            <button
              onClick={() => handleRemoveLayer(layer.id)}
              className="p-1 text-text-secondary hover:text-red-400 transition-colors"
              title="Remove layer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
