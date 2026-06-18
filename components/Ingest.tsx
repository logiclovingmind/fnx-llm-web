'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_FRAG } from '@/lib/shaders';
import { drainFlood } from '@/lib/ingest';
import { useExperience } from '@/lib/store';

const MOBILE =
  typeof navigator !== 'undefined' &&
  (Math.min(window.innerWidth, window.innerHeight) < 700 ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
const COUNT = MOBILE ? 3200 : 7200;
const DUR = 2.4; // seconds for an emitted message to fly into the field

// Mirrors PARTICLE_VERT so arrived particles are indistinguishable from the main
// field, but each point flies from its spawn (the bubble's screen position,
// unprojected) into a chaos-shell target, then lives on as part of the cosmos.
const INGEST_VERT = /* glsl */ `
uniform float uTime, uProg, uPix, uDur;
attribute vec3 aTarget;
attribute float aBorn, aSeed;
varying float vA; varying float vHot;
void main(){
  float age = uTime - aBorn;
  float born = step(0.0, age);          // 0 for unborn / recycled-future slots
  float t = clamp(age / uDur, 0.0, 1.0);
  float e = t * t * (3.0 - 2.0 * t);    // smoothstep ease
  vec3 p = mix(position, aTarget, e);   // built-in position attr holds the spawn
  // same gentle life as the field, eased in by t so it blends on arrival
  float calm = 1.0 - smoothstep(0.34, 0.6, uProg) * 0.92;
  p.y += sin(uTime*0.35 + aSeed*12.0) * (0.6 - uProg*0.4) * calm * t;
  float ang = uTime*0.014*(aSeed-0.5) * calm * t;
  float c = cos(ang), s = sin(ang);
  p.xz = mat2(c,-s,s,c) * p.xz;
  vHot = clamp(uProg*1.2 + (1.0 - smoothstep(0.0,40.0,length(p)))*0.5, 0.0, 1.0);
  vec4 mv = modelViewMatrix*vec4(p,1.0);
  float size = (0.5 + aSeed*0.9);
  gl_PointSize = min(size * uPix * (165.0/-mv.z), 7.0 * uPix);
  gl_Position = projectionMatrix*mv;
  // visible in two windows: the hero chaos beat, and the "human vs. machine" beat
  // where the frailty lines shatter into the field (~0.50-0.56 of the journey)
  float heroFade = 1.0 - smoothstep(0.06, 0.17, uProg);
  float limitsFade = smoothstep(0.45, 0.50, uProg) * (1.0 - smoothstep(0.60, 0.64, uProg));
  float fade = clamp(heroFade + limitsFade, 0.0, 1.0);
  vA = smoothstep(220.0, 20.0, -mv.z) * born * fade;
}
`;

export default function Ingest() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { gl, camera, size } = useThree();
  const cursor = useRef(0);
  const uTime = useRef(0);

  const { geometry, uniforms, spawn, target, born } = useMemo(() => {
    const spawn = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const born = new Float32Array(COUNT).fill(1e9); // far future = invisible
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) seed[i] = Math.random();

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(spawn, 3)); // spawn point
    g.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
    g.setAttribute('aBorn', new THREE.BufferAttribute(born, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);

    const u = {
      uTime: { value: 0 },
      uProg: { value: 0 },
      uPix: { value: gl.getPixelRatio() },
      uDur: { value: DUR },
    };
    return { geometry: g, uniforms: u, spawn, target, born };
  }, [gl]);

  const v = useMemo(() => new THREE.Vector3(), []);
  // screen px -> world point on the z=0 plane (where the field lives)
  const screenToWorld = (px: number, py: number) => {
    v.set((px / size.width) * 2 - 1, -(py / size.height) * 2 + 1, 0.5).unproject(camera);
    v.sub(camera.position);
    const t = (0 - camera.position.z) / v.z;
    return [
      camera.position.x + v.x * t,
      camera.position.y + v.y * t,
      camera.position.z + v.z * t,
    ] as const;
  };

  useFrame((_, dt) => {
    uTime.current += dt;
    const m = matRef.current;
    if (m) {
      m.uniforms.uTime.value = uTime.current;
      m.uniforms.uProg.value = useExperience.getState().progress;
    }

    const reqs = drainFlood();
    if (reqs.length === 0) return;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const tgtAttr = geometry.getAttribute('aTarget') as THREE.BufferAttribute;
    const bornAttr = geometry.getAttribute('aBorn') as THREE.BufferAttribute;

    for (const r of reqs) {
      for (let k = 0; k < r.n; k++) {
        const i = cursor.current;
        cursor.current = (cursor.current + 1) % COUNT;
        // spawn spread across the bubble's footprint -> reads as the text shattering
        const [wx, wy, wz] = screenToWorld(r.x + Math.random() * r.w, r.y + Math.random() * r.h);
        spawn[i * 3] = wx;
        spawn[i * 3 + 1] = wy;
        spawn[i * 3 + 2] = wz;
        // chaos-shell target — identical distribution to formations F0, so the
        // particle settles seamlessly into the existing cosmos
        const rr = 24 + Math.pow(Math.random(), 0.6) * 88;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        target[i * 3] = Math.sin(ph) * Math.cos(th) * rr;
        target[i * 3 + 1] = Math.cos(ph) * rr * 0.55;
        target[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
        born[i] = uTime.current;
      }
    }
    posAttr.needsUpdate = true;
    tgtAttr.needsUpdate = true;
    bornAttr.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={INGEST_VERT}
        fragmentShader={PARTICLE_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
