import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const Loader: React.FC = () => {
  const { isLoaded } = useAppStore();

  if (isLoaded) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ease-out">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-pink-glow border-t-transparent"></div>
      <h2 className="mt-6 animate-pulse font-cinzel text-xl text-pink-glow">
        Loading Magic...
      </h2>
    </div>
  );
};
