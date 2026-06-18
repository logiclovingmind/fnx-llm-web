'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useExperience } from '@/lib/store';

// Per-scene camera keyframes (z depth + y height), ported from the standalone.
const CAM = [
  { z: 62, y: 0 }, // chaos
  { z: 60, y: 14 }, // leak (look down the funnel)
  { z: 40, y: 0 }, // intelligence (close)
  { z: 54, y: 6 }, // automation
  { z: 96, y: 10 }, // scale (pull back, vast)
  { z: 64, y: 4 }, // skyline (push in for a dense, near-level hero view of the city)
];

function camAt(prog: number) {
  const g = Math.min(prog * 5, 4.9999);
  const i = Math.floor(g);
  const f = g - i;
  const a = CAM[i];
  const b = CAM[Math.min(i + 1, 5)];
  const e = f * f * (3 - 2 * f); // smoothstep
  return { z: a.z + (b.z - a.z) * e, y: a.y + (b.y - a.y) * e };
}

const damp = (cur: number, to: number, rate: number, dt: number) =>
  cur + (to - cur) * (1 - Math.exp(-rate * dt));

export default function CameraRig() {
  const { camera } = useThree();
  const prog = useRef(0);

  useFrame((_state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const target = useExperience.getState().progress;
    prog.current = damp(prog.current, target, 4.5, dt);

    const cam = camAt(prog.current);
    camera.position.x = damp(camera.position.x, 0, 3, dt);
    camera.position.y = damp(camera.position.y, cam.y, 3.4, dt);
    camera.position.z = damp(camera.position.z, cam.z, 3.4, dt);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
