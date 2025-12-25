import { Canvas } from '@react-three/fiber';
import { ChristmasTree } from './ChristmasTree';
import { Snow } from './Snow';
import { PhotoGallery } from './PhotoGallery';
import { Effects } from './Effects';
import { CameraRig } from './CameraRig';
import { Environment, OrbitControls } from '@react-three/drei';

export const MainScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, -1, 24], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050208']} />
        
        {/* User-controlled rotation */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={10}
          maxDistance={40}
          autoRotate={false}
          makeDefault
        />
        
        {/* Rich multi-point lighting for 3D depth */}
        <ambientLight intensity={0.3} color="#1a1a2e" />
        
        {/* Main key light - warm from upper right */}
        <pointLight position={[8, 12, 8]} intensity={2.5} color="#fff5e6" distance={50} decay={2} />
        
        {/* Fill light - cooler from left */}
        <pointLight position={[-10, 5, 5]} intensity={1.2} color="#e6f0ff" distance={40} decay={2} />
        
        {/* Rim light - from behind for silhouette */}
        <pointLight position={[0, -5, -10]} intensity={1.5} color="#ffe6f0" distance={30} decay={2} />
        
        {/* Top spotlight on star */}
        <spotLight 
          position={[0, 15, 5]} 
          angle={0.3} 
          penumbra={0.8} 
          intensity={3} 
          color="#fff8e7"
          target-position={[0, 7, 0]}
        />
        
        {/* Subtle environment for reflections */}
        <Environment preset="night" />
        
        <CameraRig>
            <ChristmasTree />
            <PhotoGallery />
        </CameraRig>
        
        <Snow />
        <Effects />
      </Canvas>
    </div>
  );
};
