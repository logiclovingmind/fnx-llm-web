'use client';

import { useRef } from 'react';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export default function Effects() {
  // very light aberration — at 0.0013 with radial modulation the tiny bright
  // particles (worst at the framed edges, i.e. the skyline) split into red/green
  // RGB confetti. Kept barely-there for a premium lens feel, not channel noise.
  const offset = useRef(new THREE.Vector2(0.0005, 0.0005));

  return (
    <EffectComposer multisampling={0}>
      {/* contained, defined glow — strength 0.62, threshold 0.5, radius 0.4 */}
      <Bloom
        intensity={0.62}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.6}
        mipmapBlur
        radius={0.4}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={offset.current}
        radialModulation
        modulationOffset={0.15}
      />
    </EffectComposer>
  );
}
