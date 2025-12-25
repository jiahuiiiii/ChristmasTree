import React, { useEffect, useRef } from 'react';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: 640,
                height: 480
            } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or failed:", err);
      }
    };

    startCamera();
  }, []);

  return (
    <div className="absolute bottom-8 left-8 z-20 h-[150px] w-[200px] overflow-hidden rounded-lg border-2 border-pink-glow bg-black/20 backdrop-blur-sm">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover opacity-80"
        style={{ transform: "scaleX(-1)" }} // Mirror
      />
    </div>
  );
};
