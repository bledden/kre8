import { Music } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8 text-primary-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Kre8</h1>
            <p className="text-sm text-gray-400">Voice-Activated Live Coding Music</p>
          </div>
        </div>
      </div>
    </header>
  );
}

