import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

// Import all images from the pics folder
const imageModules = import.meta.glob('/src/assets/pics/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true, as: 'url' });

const Photo: React.FC<{ url: string; index: number; total: number; scrollOffset: number }> = ({ url, index, total, scrollOffset }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewMode } = useAppStore();
  
  // Calculate positions for all three modes
  const { treePos, scatterPos } = useMemo(() => {
    // Tree Position (Spiral around the tree)
    const treeHeight = 12;
    const baseRadius = 4.5;
    
    const t = (index + 0.5) / total;
    const y = -treeHeight / 2 + t * treeHeight * 0.85;
    const normalizedY = (y + treeHeight / 2) / treeHeight;
    const coneRadius = baseRadius * (1 - normalizedY * 0.9);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;
    
    const tx = coneRadius * 1.1 * Math.cos(angle);
    const tz = coneRadius * 1.1 * Math.sin(angle);
    
    // Scatter Position - 3D sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * 16;
    const sx = r * Math.sin(phi) * Math.cos(theta);
    const sy = r * Math.sin(phi) * Math.sin(theta);
    const sz = r * Math.cos(phi);
    
    return { 
      treePos: new THREE.Vector3(tx, y, tz), 
      scatterPos: new THREE.Vector3(sx, sy, sz)
    };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    let target: THREE.Vector3;
    let targetScale: number;

    if (viewMode === 'FOCUS') {
      // Cylinder arrangement - photos on cylinder surface with more spacing
      const cylinderRadius = 15;
      const anglePerPhoto = (Math.PI * 2) / total;
      const baseAngle = index * anglePerPhoto + scrollOffset;
      
      // Position on cylinder surface centered around origin
      const fx = cylinderRadius * Math.sin(baseAngle);
      const fz = cylinderRadius * Math.cos(baseAngle);
      const fy = 0;
      
      target = new THREE.Vector3(fx, fy, fz);
      targetScale = 1.2;
    } else if (viewMode === 'SCATTER') {
      target = scatterPos;
      targetScale = 1.5;
    } else {
      target = treePos;
      targetScale = 0.6;
    }

    // Smooth interpolation
    const speed = 3 * delta;
    groupRef.current.position.lerp(target, speed);
    
    // Scale
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, speed);
    groupRef.current.scale.set(newScale, newScale, newScale);

    // Rotation - always face the camera (billboard style)
    groupRef.current.lookAt(state.camera.position);
  });

  return (
    <group ref={groupRef}>
      {/* Polaroid Frame - white border */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.3, 1.6]} />
        <meshStandardMaterial color="#f8f8f5" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Photo shadow/depth */}
      <mesh position={[0.03, -0.03, -0.03]}>
        <planeGeometry args={[1.3, 1.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      {/* The actual photo */}
      <Image 
        url={url} 
        transparent 
        side={THREE.DoubleSide}
        scale={[1.1, 1.1]}
        position={[0, 0.15, 0]}
      />
      
      {/* Hanging string/ribbon effect - only show in TREE mode */}
      {viewMode === 'TREE' && (
        <mesh position={[0, 0.85, 0]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
      )}
    </group>
  );
};

export const PhotoGallery: React.FC = () => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const { viewMode } = useAppStore();
  
  // Get all image URLs from the glob import
  const photoUrls = useMemo(() => {
    return Object.values(imageModules) as string[];
  }, []);

  // Handle mouse wheel scrolling in FOCUS mode
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (viewMode === 'FOCUS') {
        e.preventDefault();
        const scrollSpeed = 0.003;
        setScrollOffset(prev => prev + e.deltaY * scrollSpeed);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [viewMode]);

  // Handle touch/drag scrolling in FOCUS mode
  useEffect(() => {
    let lastX = 0;
    let isDragging = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (viewMode === 'FOCUS') {
        isDragging = true;
        lastX = e.clientX;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && viewMode === 'FOCUS') {
        const deltaX = e.clientX - lastX;
        const dragSpeed = 0.01;
        setScrollOffset(prev => prev + deltaX * dragSpeed);
        lastX = e.clientX;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [viewMode]);

  return (
    <group>
      {photoUrls.map((url, i) => (
        <Photo key={url} url={url} index={i} total={photoUrls.length} scrollOffset={scrollOffset} />
      ))}
    </group>
  );
};
