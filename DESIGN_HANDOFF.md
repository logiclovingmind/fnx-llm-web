# Design Handoff — Logic Loving Mind

> A cinematic, single-world WebGL site for a real-estate **automation intelligence** company.
> This document briefs a designer (or another Claude) to refine the *visual & motion design*
> without re-reading the whole codebase. It maps creative intent → exact tunable knobs.

---

## 1. The One-Sentence Idea

It is **not a website** — it is one continuous, scroll-driven universe where a *storm of
real-estate leads* is captured by a *gold intelligence core* and reorganized into a
*self-running empire*. The viewer should feel **"I need this"** before reading much text.

**Emotional arc (never break this order):**

```
CHAOS  →  CONTROL  →  AUTOMATION  →  SCALE
storm     core/order    transform      highways → skyline
```

There are **no sections, no page transitions, no card grids**. The same particles
continuously *re-form* into each beat. If a change makes it feel like stacked sections,
it is wrong.

---

## 2. Brand & Color System

Palette is derived directly from the logo `Final LLM 1.svg` — a nested chevron in a
**deep-purple → gold** gradient. Purple = chaos/unqualified. Gold = intelligence/control.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#070318` | Deep indigo space (base) |
| Logo darkest | `#180731` | Shadow purple |
| Logo mid | `#37135c` → `#7d372f` | Transition |
| Logo warm | `#cc6c16` | Amber |
| `--gold` | `#f5c16c` | Primary accent / intelligence |
| `--gold-deep` | `#cc8a2e` | Gold shadow / gradient end |
| Logo brightest | `#f2af1d` | Peak gold |
| `--violet` | `#8a6bd8` | Chaos accent |
| `--cream` | `#f4f1ea` | Primary text |
| `--muted` | `#b9b1c4` | Body text |

Tokens live in `app/globals.css` (`:root`). **GPU particle colors** are separate, set in
GLSL at `lib/shaders.ts → PARTICLE_FRAG`:

| Particle state | RGB (0–1) | Meaning |
|---|---|---|
| `violet` | `0.60, 0.44, 0.98` | Raw inquiry (chaos) |
| `ember` | `0.96, 0.36, 0.30` | Revenue leaking away |
| `gold` | `1.00, 0.78, 0.42` | Qualified / controlled |
| `cyan` | `0.55, 0.85, 0.95` | Data in motion (highways) |

> **Rule:** color should *earn* gold. Particles only warm to gold as they near/enter the
> core (`vPhase ≥ ~0.4`). Don't make everything gold up front — the payoff is the journey.

---

## 3. Typography

- **Stack:** `Helvetica Neue / Inter`, system fallback (`--font` in globals.css).
- **Headlines** (`.beat h2`): `clamp(30px, 5.6vw, 72px)`, weight **200**, letter-spacing
  `-0.02em`. Thin + large = luxury/editorial, not SaaS-bold.
- **Kicker** (`.beat .kicker`): 11px, `letter-spacing: 0.55em`, uppercase, **gold**.
- **Body** (`.beat p`): `clamp(14px, 1.4vw, 17px)`, weight 300, `--muted`, max-width 560px.
- **Chips** (`.chip`): 11px, `0.16em` tracking, uppercase, gold-tinted glass pill.

Keep copy short. **Visual first, text second.** Headlines are emotional, not feature lists.

---

## 4. The Six Beats (narrative engine)

Copy + tags live in `lib/scenes.ts`. Each beat has an `at` value = the scroll progress
(0–1) where it is fully centered. The overlay fades each beat in/out around its `at`.

| # | id | `at` | Kicker | Feeling |
|---|---|---|---|---|
| 1 | `storm` | 0.06 | The Lead Storm | Overwhelmed |
| 2 | `leak` | 0.28 | The Revenue Leak | Loss / urgency |
| 3 | `core` | 0.46 | The Intelligence | Hope / awe |
| 4 | `transform` | 0.64 | The Transformation | Relief / order |
| 5 | `scale` | 0.82 | The Scale Engine | Freedom / power |
| 6 | `skyline` | 0.97 | The Skyline | Aspiration → CTA |

**Two timelines must stay in sync** — if you move a beat, move *both*:
1. Text `at` value → `lib/scenes.ts`
2. Particle morph window → `lib/shaders.ts → PARTICLE_VERT → morph()`
3. (Often) camera keyframe → `components/CameraRig.tsx → KEYS`

---

## 5. How Everything Is Driven (mental model)

```
Lenis smooth scroll ──> Zustand store (lib/store.ts: progress 0..1)
                              │
        ┌─────────────────────┼───────────────────────────┐
        ▼                     ▼                            ▼
  Particles morph()     CameraRig sample()           Overlay (rAF)
  Core visibility       Background grade              HUD progress + beats
  Effects intensity
```

- **One number runs the whole film:** `progress` (0 = top, 1 = bottom).
- Every 3D component reads `useExperience.getState().progress` inside `useFrame` and
  **lerps toward it** (critically-damped follow) for buttery scrubbing — never snaps.
- The Canvas is **mounted once and never destroyed**. Scroll height comes from an empty
  `.scroll-spacer` (currently `760vh`) in `app/page.tsx`.

---

## 6. The Particle World (the hero element)

`components/Particles.tsx` + `lib/formations.ts` + `lib/shaders.ts`.

- **24,000** points (`COUNT` in `Particles.tsx`). Additive blending, soft round sprites.
- Six precomputed **formations** (CPU, `buildFormations()`), blended **sequentially** in
  the vertex shader so the morph is always continuous:

| Formation | Shape | Beat |
|---|---|---|
| `storm` | flattened chaotic sphere cloud (r 26–122) | 1 |
| `leak` | sinking, draining downward into dark | 2 |
| `attract` | tight inward spiral toward center | 3 (entry) |
| `orbit` | clean concentric orbital disk (7 rings) | 4 |
| `highway` | 14 parallel rivers streaming along Z | 5 |
| `skyline` | 90 towers of light around the core | 6 |

- **Live motion** layered on top of formation: chaotic drift early, swirl during
  attraction, streaming flow during highways. All in `PARTICLE_VERT`.

> **To add/replace a formation:** add a `Float32Array` in `buildFormations()`, expose it
> as a geometry attribute in `Particles.tsx`, and insert one `mix(...)` line in
> `morph()`. Nothing else needs to change.

---

## 7. The AI Core

`components/Core.tsx` — noise-displaced icosahedron (`CORE_VERT/FRAG`), fresnel gold rim,
solid inner glow sphere, additive halo sprite. Appears from `progress ≈ 0.30`, full by
`0.44` (`targetVis = (p - 0.30) / 0.14`). Gentle breathing pulse + slow rotation.
It is *mysterious intelligence*, **never a robot or chatbot face**.

---

## 8. Camera

`components/CameraRig.tsx → KEYS` — keyframed dolly through the six beats + mouse parallax
+ slow handheld float. Current path:

| progress | position | lookAt |
|---|---|---|
| 0.00 | `0, 4, 80` | inside the storm |
| 0.28 | `0, -12, 62` | following the leak down |
| 0.46 | `0, 2, 38` | facing the core |
| 0.64 | `0, 9, 46` | above the ordered orbit |
| 0.82 | `0, 6, 98` | pulled back over highways |
| 1.00 | `0, 28, 152` | rising over the skyline |

Smoothed with `smoothstep` between keys; never cut.

---

## 9. Post-Processing (the "expensive" look)

`components/Effects.tsx`:

| Effect | Current | Note |
|---|---|---|
| Bloom | intensity `1.05`, threshold `0.18`, smoothing `0.7`, radius `0.8`, mipmapBlur | the core glow |
| Chromatic Aberration | offset `~0.0006–0.0024`, radial | **eases off as order arrives** (chaos = more fringing) |
| Noise (grain) | `0.18`, OVERLAY | film texture |
| Vignette | offset `0.28`, darkness `0.92` | focus the frame |

Plus CSS film layers in `app/page.tsx`: `.grain` (SVG turbulence) + `.vignette`.

---

## 10. Tuning Cheat-Sheet (intent → knob)

| You want… | Change |
|---|---|
| Faster/slower journey | `.scroll-spacer` height in `app/page.tsx` (↑ = slower) |
| Scrub feel (snappier/floatier) | lerp factor `dt * 3.2` in `Particles.tsx`; `duration` in `SmoothScroll.tsx` |
| More/fewer particles | `COUNT` in `Particles.tsx` |
| Re-time a beat | `at` in `scenes.ts` **+** `morph()` window **+** camera `KEYS` |
| More chaos energy | drift multipliers in `PARTICLE_VERT`; CA offset in `Effects.tsx` |
| Stronger core glow | Bloom `intensity`; `uAmp` / halo scale in `Core.tsx` |
| Background mood | gradient/nebula colors in `BG_FRAG` |
| Copy / tags | `lib/scenes.ts` |
| Type scale | `.beat h2 / p / .kicker` in `globals.css` |

---

## 11. File Map

```
app/
  layout.tsx        metadata, fonts, root
  page.tsx          assembles Preloader + Canvas + Overlay + film layers + scroll-spacer
  globals.css       design tokens, HUD, beats, chips, CTA, preloader
components/
  Experience.tsx    the single <Canvas>
  World.tsx         scene graph (bg + particles + core + camera + effects)
  Background.tsx    nebula sphere shader
  Particles.tsx     24k GPU lead system
  Core.tsx          gold intelligence sphere
  CameraRig.tsx     scroll-driven cinematic camera
  Effects.tsx       bloom / CA / grain / vignette
  Overlay.tsx       rAF-driven HTML narrative + HUD
  SmoothScroll.tsx  Lenis → store
  Preloader.tsx     branded intro
lib/
  store.ts          Zustand: progress, ready
  scenes.ts         beat copy + tags + brand
  formations.ts     CPU keyframe geometry
  shaders.ts        all GLSL (particles, core, background, simplex noise)
demo.html           standalone single-file proof of Scene 1 (no build needed)
```

Run: `npm run dev` (currently on `http://localhost:3005`).

---

## 12. State & Opportunities for the Next Designer

**Done:** full six-scene world, scroll engine, custom shaders, post, overlay, HUD,
preloader, responsive type, brand palette. Compiles clean, types pass.

**Not yet verified:** live WebGL was not viewed in a real browser by the builder — do a
visual QA pass and confirm shader compile + perf on target hardware.

**High-value polish ideas (in priority order):**
1. **Readable text-over-3D** — a subtle radial scrim behind active beats so headlines stay
   legible against bright particle fields.
2. **Floating lead labels in Scene 1** — real inquiry strings ("Site Visit Request",
   "₹5L") as sprites/MSDF text drifting in 3D, not just CSS chips.
3. **Core "ingestion" moment** (Scene 3→4) — visibly pull a few labelled leads *into* the
   core and emit gold "Qualified / Booked / CRM Updated" tokens out the other side.
4. **Skyline payoff** — let towers *build upward* (grow) on entry rather than appear.
5. **Performance tier** — detect mobile/low-GPU, drop `COUNT` to ~9k and disable CA.
6. **Sound design hook** — optional ambient drone that rises with `progress`.
7. **Logo lockup** — render `Final LLM 1.svg` mark in the HUD / preloader instead of "LLM".

**Guardrails — do not:** add stacked sections, card grids, feature boxes, hard page
transitions, default Three.js looks, or all-gold-everywhere. Keep one evolving world.
```
Target reaction: "How much did they spend on this website?"
```
