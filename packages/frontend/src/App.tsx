import { useState } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import CodePanel from './components/CodePanel';
import PlaybackControls from './components/PlaybackControls';
import { useAppStore } from './stores/appStore';

function App() {
  const { currentCode, isLoading, error } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <InputPanel />
            {error && (
              <div className="card bg-red-900/20 border-red-700">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Code & Playback */}
          <div className="space-y-6">
            <CodePanel />
            {currentCode && <PlaybackControls />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

