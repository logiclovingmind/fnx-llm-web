'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BG_VERT, BG_FRAG } from '@/lib/shaders';
import { useExperience } from '@/lib/store';

export default function Background() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const smooth = useRef(0);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uProg: { value: 0 } }),
    []
  );

  useFrame((_, dt) => {
    const target = useExperience.getState().progress;
    smooth.current += (target - smooth.current) * (1 - Math.exp(-4.5 * Math.min(dt, 0.05)));
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uProg.value = smooth.current;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[300, 32, 32]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={BG_VERT}
        fragmentShader={BG_FRAG}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
