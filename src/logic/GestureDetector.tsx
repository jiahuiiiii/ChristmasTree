import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useAppStore } from '../store/useAppStore';
import { handPosition } from './handState';

type GestureType = 'FIST' | 'OPEN' | 'PINCH' | 'NONE';

export const GestureDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastModeChangeTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 3000;

  useEffect(() => {
    console.log('GestureDetector: Setting up...');
    
    const setup = async () => {
      try {
        console.log('GestureDetector: Loading MediaPipe...');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        landmarkerRef.current = landmarker;
        console.log('GestureDetector: MediaPipe loaded!');

        // Start Camera
        console.log('GestureDetector: Starting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.onloadeddata = () => {
             console.log('GestureDetector: Camera ready, starting prediction loop');
             video.play();
             predict();
        };
        videoRef.current = video;

      } catch (err) {
        console.error("GestureDetector: MediaPipe Init Error:", err);
      }
    };

    setup();

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const predict = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (video && landmarker && video.readyState >= 2) {
      const results = landmarker.detectForVideo(video, performance.now());
      const now = Date.now();
      
      if (results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const gesture = analyzeGesture(landmarks);

        // Update hand position directly (no React state)
        const cx = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
        const cy = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;
        
        // Update the shared state
        handPosition.x = 1 - cx;
        handPosition.y = cy;
        
        console.log('Hand detected:', handPosition.x.toFixed(2), handPosition.y.toFixed(2), gesture);

        // Mode change with cooldown
        const timeSinceLastChange = now - lastModeChangeTimeRef.current;
        
        if (timeSinceLastChange > COOLDOWN_MS && gesture !== 'NONE') {
          const currentMode = useAppStore.getState().viewMode;
          let newMode = currentMode;
          
          if (gesture === 'OPEN') {
            newMode = 'SCATTER';
          } else if (gesture === 'FIST') {
            newMode = 'TREE';
          } else if (gesture === 'PINCH') {
            newMode = 'FOCUS';
          }
          
          if (newMode !== currentMode) {
            console.log('Mode change:', currentMode, '->', newMode);
            useAppStore.getState().setViewMode(newMode);
            lastModeChangeTimeRef.current = now;
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  };

  const analyzeGesture = (landmarks: any[]): GestureType => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDist = distance(thumbTip, indexTip);
    
    if (pinchDist < 0.08) return 'PINCH';

    const extendedCount = [8, 12, 16, 20].filter(tip => isFingerExtended(landmarks, tip)).length;
    if (extendedCount >= 3) return 'OPEN';

    const curledCount = [8, 12, 16, 20].filter(tip => isFingerCurled(landmarks, tip)).length;
    if (curledCount >= 3) return 'FIST';

    return 'NONE';
  };

  const distance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
  };

  const isFingerExtended = (landmarks: any[], tipIdx: number) => {
      return distance(landmarks[tipIdx], landmarks[0]) > distance(landmarks[tipIdx-2], landmarks[0]);
  };

  const isFingerCurled = (landmarks: any[], tipIdx: number) => {
      return distance(landmarks[tipIdx], landmarks[0]) < distance(landmarks[tipIdx-2], landmarks[0]);
  };

  return null;
};
