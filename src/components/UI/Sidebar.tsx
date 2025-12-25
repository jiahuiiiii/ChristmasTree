import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { gesture } = useAppStore();

  const Item = ({ type, label, active }: { type: string; label: string; active: boolean }) => (
    <div className={clsx(
      "flex flex-col items-center justify-center p-4 rounded-xl backdrop-blur-md transition-all duration-300 border",
      active ? "bg-pink-glow/20 border-pink-glow scale-105 shadow-[0_0_15px_rgba(255,105,180,0.3)]" : "bg-black/30 border-white/10 opacity-70"
    )}>
      <span className="text-sm font-cinzel text-white/90">{label}</span>
      <span className="text-xs text-white/50 mt-1 uppercase tracking-widest">{type}</span>
    </div>
  );

  return (
    <div className="absolute top-1/2 right-8 -translate-y-1/2 z-20 flex flex-col gap-4 w-32">
      <Item type="Fist" label="Tree Form" active={gesture === 'FIST' || gesture === 'NONE'} />
      <Item type="Open" label="Scatter" active={gesture === 'OPEN'} />
      <Item type="Pinch" label="Focus Focus" active={gesture === 'PINCH'} />
    </div>
  );
};
