import { create } from 'zustand';

export type GestureType = 'FIST' | 'OPEN' | 'PINCH' | 'NONE';

interface AppState {
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
  gesture: GestureType;
  setGesture: (gesture: GestureType) => void;
  viewMode: 'TREE' | 'SCATTER' | 'FOCUS';
  setViewMode: (mode: 'TREE' | 'SCATTER' | 'FOCUS') => void;
  handPosition: { x: number, y: number };
  setHandPosition: (pos: { x: number, y: number }) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  focusedPhotoId: string | null;
  setFocusedPhotoId: (id: string | null) => void;
  photos: string[]; // List of photo URLs
  addPhoto: (url: string) => void;
  triggerPhotoUpload: () => void; // Trick to trigger hidden input
  setTriggerPhotoUpload: (fn: () => void) => void;
  gestureEnabled: boolean;
  setGestureEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoaded: false,
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  gesture: 'NONE',
  setGesture: (gesture) => set({ gesture }),
  viewMode: 'TREE',
  setViewMode: (mode) => set({ viewMode: mode }),
  handPosition: { x: 0.5, y: 0.5 },
  setHandPosition: (pos) => set({ handPosition: pos }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  focusedPhotoId: null,
  setFocusedPhotoId: (id) => set({ focusedPhotoId: id }),
  photos: [],
  addPhoto: (url) => set((state) => ({ photos: [...state.photos, url] })),
  triggerPhotoUpload: () => {},
  setTriggerPhotoUpload: (fn) => set({ triggerPhotoUpload: fn }),
  gestureEnabled: false,
  setGestureEnabled: (enabled) => set({ gestureEnabled: enabled }),
}));
