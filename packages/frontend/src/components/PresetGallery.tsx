import { Star, Play, X } from 'lucide-react';
import { useAppStore, Favorite } from '../stores/appStore';
import { executeCode } from '../services/strudelService';

export default function PresetGallery() {
  const { recentFavorites, removeFavorite, setCurrentCode, setPlayback } = useAppStore();

  const handleFavoriteClick = async (favorite: Favorite) => {
    // Build StrudelCode object
    const strudelCode = {
      code: favorite.code,
      metadata: {
        tempo: favorite.tempo,
        bpm: favorite.tempo,
        instruments: favorite.instruments,
      },
    };

    setCurrentCode(strudelCode);

    try {
      await executeCode(strudelCode);
      setPlayback({ isPlaying: true, tempo: favorite.tempo || 120 });
    } catch (error) {
      console.error('Failed to play favorite:', error);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
  };

  // Format display name from genre/instruments
  const getDisplayName = (favorite: Favorite): string => {
    if (favorite.genre) {
      return favorite.genre.charAt(0).toUpperCase() + favorite.genre.slice(1);
    }
    if (favorite.instruments?.length) {
      return favorite.instruments[0];
    }
    return 'Beat';
  };

  if (recentFavorites.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <h2 className="text-lg font-semibold">Recent Favorites</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Rate tracks 5 stars to save them here for quick replay
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <h2 className="text-lg font-semibold">Recent Favorites</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {recentFavorites.map((favorite) => (
          <button
            key={favorite.id}
            onClick={() => handleFavoriteClick(favorite)}
            className="group relative p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:border-yellow-400/50 hover:scale-[1.02] transition-all"
          >
            <button
              onClick={(e) => handleRemove(e, favorite.id)}
              className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 transition-opacity"
              aria-label="Remove favorite"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex flex-col items-center text-center">
              <Play className="w-5 h-5 mb-1 text-yellow-400 opacity-80 group-hover:opacity-100" />
              <span className="text-xs font-medium text-text-primary truncate w-full">
                {getDisplayName(favorite)}
              </span>
              {favorite.tempo && (
                <span className="text-[10px] text-text-secondary">{favorite.tempo} BPM</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
