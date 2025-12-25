import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Snow: React.FC = () => {
  const count = 1000;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 20; // x
        pos[i * 3 + 1] = Math.random() * 20 - 5; // y
        pos[i * 3 + 2] = (Math.random() - 0.5) * 20; // z

        vel[i * 3] = (Math.random() - 0.5) * 0.02; // x sway
        vel[i * 3 + 1] = -Math.random() * 0.05 - 0.02; // y drop
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // z sway
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        pos[idx] += velocities[idx]; // x
        pos[idx + 1] += velocities[idx + 1]; // y
        pos[idx + 2] += velocities[idx + 2]; // z

        // Reset if too low
        if (pos[idx + 1] < -10) {
            pos[idx + 1] = 10;
        }
        // Wrap X/Z
        if (pos[idx] > 10) pos[idx] = -10;
        if (pos[idx] < -10) pos[idx] = 10;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          uniform float uTime;
          attribute float aScale;
          void main() {
            vec3 pos = position;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = (300.0 / -mvPosition.z); // Size attenuation
          }
        `}
        fragmentShader={`
          void main() {
            // Soft Circle
            float r = distance(gl_PointCoord, vec2(0.5));
            if (r > 0.5) discard;
            float glow = 1.0 - (r * 2.0);
            glow = pow(glow, 1.5);
            gl_FragColor = vec4(1.0, 1.0, 1.0, 0.8 * glow);
          }
        `}
      />
    </points>
  );
};
