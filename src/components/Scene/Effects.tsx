// @ts-nocheck
import React from 'react';
import { EffectComposer, Bloom, Vignette, ToneMapping, HueSaturation } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

export const Effects: React.FC = () => {
    return (
        <EffectComposer multisampling={0} disableNormalPass>
            {/* Rich bloom for glowing lights and decorations */}
            <Bloom 
                luminanceThreshold={0.5} 
                mipmapBlur 
                intensity={1.8} 
                radius={0.7}
                levels={6}
            />
            
            {/* Boost saturation for vivid colors */}
            <HueSaturation
                blendFunction={BlendFunction.NORMAL}
                hue={0}
                saturation={0.35}
            />
            
            <Vignette
                offset={0.3}
                darkness={0.5}
                blendFunction={BlendFunction.NORMAL}
            />
            
            <ToneMapping
                mode={ToneMappingMode.ACES_FILMIC}
                whitePoint={4.0}
            />
        </EffectComposer>
    );
};
