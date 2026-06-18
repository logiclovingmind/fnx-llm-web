'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildFormations } from '@/lib/formations';
import { PARTICLE_VERT, PARTICLE_FRAG } from '@/lib/shaders';
import { useExperience } from '@/lib/store';

const MOBILE =
  typeof navigator !== 'undefined' &&
  (Math.min(window.innerWidth, window.innerHeight) < 700 ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
const COUNT = MOBILE ? 5500 : 11000;

export default function Particles() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const smooth = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    const { f, seed } = buildFormations(COUNT);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(f[0], 3)); // dummy (required)
    g.setAttribute('aP0', new THREE.BufferAttribute(f[0], 3));
    g.setAttribute('aP1', new THREE.BufferAttribute(f[1], 3));
    g.setAttribute('aP2', new THREE.BufferAttribute(f[2], 3));
    g.setAttribute('aP3', new THREE.BufferAttribute(f[3], 3));
    g.setAttribute('aP4', new THREE.BufferAttribute(f[4], 3));
    g.setAttribute('aP5', new THREE.BufferAttribute(f[5], 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);

    const u = {
      uTime: { value: 0 },
      uProg: { value: 0 },
      uPix: { value: gl.getPixelRatio() },
    };
    return { geometry: g, uniforms: u };
  }, [gl]);

  useFrame((_, dt) => {
    const target = useExperience.getState().progress;
    // frame-rate-independent damping to match the standalone's progress follow
    smooth.current += (target - smooth.current) * (1 - Math.exp(-4.5 * Math.min(dt, 0.05)));
    const m = matRef.current;
    if (m) {
      m.uniforms.uTime.value += dt;
      m.uniforms.uProg.value = smooth.current;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={PARTICLE_VERT}
        fragmentShader={PARTICLE_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
