/**
 * Precomputed per-particle keyframe positions for the six narrative formations.
 * Ported 1:1 from the standalone index.html. The vertex shader blends
 * sequentially between these as scroll progress moves 0 -> 1:
 *
 *   chaos -> leak -> intelligence -> automation -> scale -> skyline
 */
export type Formations = {
  count: number;
  /** six keyframe position buffers (xyz interleaved), indexed 0..5 */
  f: Float32Array[];
  seed: Float32Array;
};

const TAU = Math.PI * 2;
const rnd = () => Math.random();

export function buildFormations(count: number): Formations {
  const seed = new Float32Array(count);
  const f = [0, 1, 2, 3, 4, 5].map(() => new Float32Array(count * 3));
  const set = (arr: Float32Array, i: number, x: number, y: number, z: number) => {
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  };

  // pre-compute a skyline silhouette — towers kept inside the camera's frame at
  // the finale (look point at origin, visible x ~ ±66) so the city fills the
  // lower frame as a dense, readable band rather than a faint speckle.
  // Fewer, wider, shorter towers so the limited particle budget packs each one
  // densely enough to read as a solid mass rather than scattered glitter.
  const NB = 13;
  const GROUND = -26; // shared ground line, low in frame with open sky above
  const SPAN = 96; // tighter than the camera frame so towers pack shoulder-to-shoulder
  const bH: number[] = [];
  const bX: number[] = [];
  const bW: number[] = [];
  for (let b = 0; b < NB; b++) {
    bX[b] = (b / (NB - 1) - 0.5) * SPAN + (Math.random() - 0.5) * 1.4; // ±48
    bH[b] = 12 + Math.pow(Math.random(), 1.3) * 24; // 12 -> 36, jagged but kept clear of the copy
    bW[b] = 4.2 + Math.random() * 3.4; // 4.2 -> 7.6 wide — solid lit masses that touch
  }

  for (let i = 0; i < count; i++) {
    seed[i] = rnd();

    // F0 — CHAOS: turbulent flattened shell
    {
      const r = 24 + Math.pow(rnd(), 0.6) * 88;
      const t = rnd() * TAU;
      const p = Math.acos(2 * rnd() - 1);
      set(f[0], i, Math.sin(p) * Math.cos(t) * r, Math.cos(p) * r * 0.55, Math.sin(p) * Math.sin(t) * r);
    }
    // F1 — REVENUE LEAK: draining vortex funnel
    {
      const h = rnd(); // 0 top -> 1 drain
      const ang = rnd() * TAU + h * 6.0; // swirl as it falls
      const rad = (70 * (1.0 - h) + 3.0) * (0.85 + rnd() * 0.3);
      set(f[1], i, Math.cos(ang) * rad, 46 - h * 104, Math.sin(ang) * rad);
    }
    // F2 — INTELLIGENCE: ordered orbital shells around the core
    {
      const shell = 16 + (i % 3) * 5 + rnd() * 2.2;
      const t = rnd() * TAU;
      const p = Math.acos(2 * rnd() - 1);
      set(f[2], i, Math.sin(p) * Math.cos(t) * shell, Math.cos(p) * shell, Math.sin(p) * Math.sin(t) * shell);
    }
    // F3 — AUTOMATION: an orchestrated disc revolving around the AI core —
    // every lead qualified, routed and followed up in clean concentric orbits.
    {
      const RINGS = 5;
      const ring = i % RINGS;
      const R = 17 + ring * 8.5 + (rnd() - 0.5) * 2.0; // distinct concentric bands
      const a = rnd() * TAU;
      const y = (rnd() - 0.5) * 2.2; // thin flat disc
      const tilt = 0.42; // single coherent tilt so it reads as a 3D disc
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      set(f[3], i, x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt));
    }
    // F4 — SCALE: vast flowing lattice extending into depth
    {
      const x = (rnd() * 2 - 1) * 108;
      const z = (rnd() * 2 - 1) * 130 - 18;
      const y = -8 + Math.sin(x * 0.08) * 3 + Math.cos(z * 0.06) * 3;
      set(f[4], i, x, y, z);
    }
    // F5 — SKYLINE: a city of light — a glowing horizon band with towers whose
    // density rises toward the rooftops, so the jagged top edge reads crisp.
    {
      const b = i % NB; // even allocation so every tower is solidly filled
      const r = rnd();
      let x: number, y: number, z: number;
      if (r < 0.1) {
        // a crisp bright horizon line that grounds the city (kept thin so it
        // reads as a baseline, not a wide haze)
        x = (rnd() - 0.5) * (SPAN + 8);
        y = GROUND + (rnd() - 0.5) * 0.9;
        z = -4 + (rnd() - 0.5) * 2;
      } else {
        // tower: a dense flat-roof cap gives a crisp top edge, the rest fills
        // the body so each tower reads as a solid lit mass
        x = bX[b] + (rnd() - 0.5) * bW[b];
        const top = GROUND + bH[b];
        y = rnd() < 0.38 ? top - rnd() * 2.4 : GROUND + rnd() * bH[b];
        z = -4 + (rnd() - 0.5) * 2.2;
      }
      set(f[5], i, x, y, z);
    }
  }

  return { count, f, seed };
}
