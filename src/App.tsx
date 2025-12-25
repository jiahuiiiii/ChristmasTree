import { useEffect } from 'react';
import { Loader } from './components/UI/Loader';
import { Header } from './components/UI/Header';
import { Controls } from './components/UI/Controls';
import { CameraView } from './components/UI/CameraView';
import { GestureDetector } from './logic/GestureDetector';
import { MainScene } from './components/Scene/MainScene';
import { useAppStore } from './store/useAppStore';

function App() {
  const { setIsLoaded, gestureEnabled } = useAppStore();

  useEffect(() => {
    // Simulate loading for now, later sync with assets
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, [setIsLoaded]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-radial-at-c from-night-start to-night-end">

      {/* 3D Scene Background */}
      <MainScene />

      {/* UI Overlay */}
      <Header />
      
      {/* Gesture Control - Camera View + Detector */}
      {gestureEnabled && (
        <>
          <CameraView />
          <GestureDetector />
        </>
      )}
      
      <Controls />

      {/* Fullscreen Loader */}
      <Loader />
    </main>
  );
}

export default App;
