import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '../../store/useAppStore';
import { handPosition } from '../../logic/handState';
import * as THREE from 'three';

export const CameraRig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        // Check if gesture control is enabled
        const gestureEnabled = useAppStore.getState().gestureEnabled;
        
        if (gestureEnabled) {
            // Map hand position (0-1) to rotation
            const yaw = (handPosition.x - 0.5) * Math.PI * 1.5;
            const pitch = (handPosition.y - 0.5) * Math.PI * 0.4;
            
            // Direct lerp to target rotation
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y, 
                yaw, 
                delta * 5
            );
            groupRef.current.rotation.x = THREE.MathUtils.lerp(
                groupRef.current.rotation.x, 
                -pitch, 
                delta * 5
            );
        } else {
            // Reset rotation when gesture control is disabled
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y, 
                0, 
                delta * 3
            );
            groupRef.current.rotation.x = THREE.MathUtils.lerp(
                groupRef.current.rotation.x, 
                0, 
                delta * 3
            );
        }
    });

    return (
        <group ref={groupRef}>
           {children}
        </group>
    );
};
