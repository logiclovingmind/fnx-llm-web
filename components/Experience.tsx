'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect } from 'react';
import World from './World';
import { useExperience } from '@/lib/store';

export default function Experience() {
  const setReady = useExperience((s) => s.setReady);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, [setReady]);

  return (
    <div className="canvas-shell">
      <Canvas
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 1.6]}
        camera={{ fov: 58, near: 0.1, far: 600, position: [0, 0, 62] }}
        onCreated={({ gl }) => gl.setClearColor('#070318', 1)}
      >
        <World />
      </Canvas>
    </div>
  );
}
