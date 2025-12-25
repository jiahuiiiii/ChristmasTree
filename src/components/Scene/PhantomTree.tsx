import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

// Simple trunk that scatters with the tree
const vertexShader = `
  uniform float uTime;
  attribute float aSize;
  varying vec3 vColor;

  void main() {
    vec3 pos = position;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (40.0 / -mvPosition.z);
    
    // Brown wood color with slight variation
    vColor = vec3(0.35, 0.2, 0.1) + vec3(sin(pos.y * 5.0) * 0.05);
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    if (r > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.35, 0.5, r);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const PhantomTree: React.FC = () => {
  const { viewMode } = useAppStore();
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const count = 3000;

  const { treePositions, scatterPositions, sizes } = useMemo(() => {
    const tPos = new Float32Array(count * 3);
    const sPos = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    // Trunk: Cylinder from bottom
    const trunkHeight = 3;
    const trunkRadius = 0.6;
    
    for (let i = 0; i < count; i++) {
      const h = Math.random() * trunkHeight;
      const y = -6 - trunkHeight / 2 + h;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * trunkRadius;
      
      tPos[i * 3] = r * Math.cos(angle);
      tPos[i * 3 + 1] = y;
      tPos[i * 3 + 2] = r * Math.sin(angle);

      sPos[i * 3] = (Math.random() - 0.5) * 40;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 40;

      sz[i] = 4 + Math.random() * 2;
    }

    return { treePositions: tPos, scatterPositions: sPos, sizes: sz };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    const isScatter = viewMode === 'SCATTER';
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const speed = 2.5 * delta;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const tx = isScatter ? scatterPositions[idx] : treePositions[idx];
      const ty = isScatter ? scatterPositions[idx + 1] : treePositions[idx + 1];
      const tz = isScatter ? scatterPositions[idx + 2] : treePositions[idx + 2];

      positions[idx] += (tx - positions[idx]) * speed;
      positions[idx + 1] += (ty - positions[idx + 1]) * speed;
      positions[idx + 2] += (tz - positions[idx + 2]) * speed;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} args={[treePositions.slice(), 3]} />
        <bufferAttribute attach="attributes-aSize" count={count} args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
        }}
      />
    </points>
  );
};
