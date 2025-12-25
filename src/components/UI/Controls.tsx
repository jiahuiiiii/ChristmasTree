import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const Controls: React.FC = () => {
  const { viewMode, setViewMode, gestureEnabled, setGestureEnabled } = useAppStore();

  return (
    <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-4">
      {/* View Mode Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setViewMode('TREE')}
          className={`px-6 py-2 rounded-full font-cinzel text-sm backdrop-blur-md transition-all hover:scale-105 border ${
            viewMode === 'TREE'
              ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200'
              : 'bg-black/30 border-white/20 text-white/70 hover:bg-black/50'
          }`}
        >
          🎄 Tree
        </button>
        <button
          onClick={() => setViewMode('SCATTER')}
          className={`px-6 py-2 rounded-full font-cinzel text-sm backdrop-blur-md transition-all hover:scale-105 border ${
            viewMode === 'SCATTER'
              ? 'bg-pink-500/40 border-pink-400 text-pink-200'
              : 'bg-black/30 border-white/20 text-white/70 hover:bg-black/50'
          }`}
        >
          ✨ Scatter
        </button>
        <button
          onClick={() => setViewMode('FOCUS')}
          className={`px-6 py-2 rounded-full font-cinzel text-sm backdrop-blur-md transition-all hover:scale-105 border ${
            viewMode === 'FOCUS'
              ? 'bg-amber-500/40 border-amber-400 text-amber-200'
              : 'bg-black/30 border-white/20 text-white/70 hover:bg-black/50'
          }`}
        >
          🔍 Focus
        </button>
      </div>

      {/* Gesture Control Toggle */}
      <div className="flex items-center gap-3">
        <span className="font-cinzel text-sm text-white/70">🖐️ Gesture Control</span>
        <button
          onClick={() => setGestureEnabled(!gestureEnabled)}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
            gestureEnabled
              ? 'bg-gradient-to-r from-pink-500 to-purple-500'
              : 'bg-black/50 border border-white/20'
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 ${
              gestureEnabled ? 'left-8' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
