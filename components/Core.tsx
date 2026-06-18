'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { CORE_VERT, CORE_FRAG, LOGO_VERT, LOGO_FRAG } from '@/lib/shaders';
import { useExperience } from '@/lib/store';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Single gold for every chevron ring — we want the brand *shape*, not the
// multi-colour palette. Matches the orb shell's gold so the mark reads as one
// solid emblem forged from the same material as the core.
const LOGO_COLOR = '#f5c16c';
const LOGO_SIZE = 11.5; // world units across — emblem nested inside the orb
const DEPTH_STEP = 0.5; // z-gap between nested chevron rings

export default function Core() {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.ShaderMaterial>(null);
  const shellMesh = useRef<THREE.Mesh>(null);
  const logoHolder = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const [mark, setMark] = useState<THREE.Group | null>(null);
  const mats = useRef<THREE.ShaderMaterial[]>([]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }), []);

  const haloTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,206,138,0.55)');
    g.addColorStop(0.22, 'rgba(245,193,108,0.22)');
    g.addColorStop(1, 'rgba(245,193,108,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  // Build the extruded brand mark from the SVG once it loads.
  useEffect(() => {
    let alive = true;
    new SVGLoader().load('/logo.svg', (data) => {
      if (!alive) return;
      const g = new THREE.Group();
      const materials: THREE.ShaderMaterial[] = [];

      data.paths.forEach((path, i) => {
        const mat = new THREE.ShaderMaterial({
          vertexShader: LOGO_VERT,
          fragmentShader: LOGO_FRAG,
          uniforms: {
            uOpacity: { value: 0 },
            uGlow: { value: 1.18 },
            uColor: { value: new THREE.Color(LOGO_COLOR) },
          },
          transparent: true,
          depthWrite: false,
        });
        materials.push(mat);

        SVGLoader.createShapes(path).forEach((shape) => {
          const geo = new THREE.ExtrudeGeometry(shape, {
            depth: 6,
            bevelEnabled: true,
            bevelThickness: 1.2,
            bevelSize: 1.0,
            bevelSegments: 2,
            steps: 1,
          });
          geo.translate(0, 0, i * DEPTH_STEP);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.renderOrder = i;
          g.add(mesh);
        });
      });

      // centre + normalise scale, flipping Y (SVG space is y-down)
      const box = new THREE.Box3().setFromObject(g);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const s = LOGO_SIZE / Math.max(size.x, size.y);
      g.children.forEach((child) => {
        const geo = (child as THREE.Mesh).geometry as THREE.BufferGeometry;
        geo.translate(-center.x, -center.y, -center.z);
        geo.scale(s, -s, s);
      });

      mats.current = materials;
      setMark(g);
    });
    return () => {
      alive = false;
    };
  }, []);

  useFrame((state) => {
    const p = useExperience.getState().progress;
    const t = state.clock.elapsedTime;
    // core lives from the intelligence beat (0.30) and bows out before skyline (0.86)
    const coreVis = clamp01((p - 0.3) / 0.1) * (1 - clamp01((p - 0.86) / 0.1));

    if (shell.current) {
      shell.current.uniforms.uTime.value = t;
      shell.current.uniforms.uOpacity.value = coreVis * 0.85;
    }
    if (shellMesh.current) {
      shellMesh.current.rotation.y = t * 0.16;
      shellMesh.current.rotation.x = t * 0.05;
    }
    for (const m of mats.current) m.uniforms.uOpacity.value = coreVis;

    if (group.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.035;
      group.current.scale.setScalar(0.001 + coreVis * pulse);
      // lift the orb into the gap between the headline and the chat card during
      // its own beat, then plunge it straight down through the "human limits"
      // stack (0.49 -> 0.56) so it leads the shatter front — each frailty line
      // breaks as the orb sweeps past it, reading as the AI swallowing them.
      // The sink runs lower (-16) so it clears below the last line.
      const coreBeat = clamp01((p - 0.32) / 0.06) * (1 - clamp01((p - 0.49) / 0.07));
      group.current.position.y = -16 + coreBeat * 21;
    }
    if (logoHolder.current) {
      // the emblem holds toward the viewer so the mark always reads, rocking
      // gently for depth instead of spinning edge-on like the orb shell
      logoHolder.current.rotation.y = Math.sin(t * 0.45) * 0.42;
      logoHolder.current.rotation.x = Math.sin(t * 0.35) * 0.12;
    }
    if (halo.current) {
      (halo.current.material as THREE.SpriteMaterial).opacity = coreVis * 0.5;
    }
  });

  return (
    <group ref={group} scale={0.001} position={[0, -11, -4]}>
      {/* living golden-plasma shell — the energy orb */}
      <mesh ref={shellMesh}>
        <icosahedronGeometry args={[7, 20]} />
        <shaderMaterial
          ref={shell}
          uniforms={uniforms}
          vertexShader={CORE_VERT}
          fragmentShader={CORE_FRAG}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* the brand mark, glowing at the heart of the intelligence */}
      <group ref={logoHolder}>{mark && <primitive object={mark} />}</group>

      <sprite ref={halo} scale={[30, 30, 1]}>
        <spriteMaterial
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0}
        />
      </sprite>
    </group>
  );
}
