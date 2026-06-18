# Fixes — Logic Loving Mind

Drop-in replacements for the live-WebGL issues found during visual QA (the handoff
flagged the build was never viewed in a real browser). I rendered the standalone
`demo.html` and the **core was blowing out to a full-frame white wash** that hid the
headline. Root cause was three things stacking: a flat brightness lift in the core
shader, a very low bloom threshold, and an oversized white halo + near-white inner sphere.

## What changed

| File | Change |
|---|---|
| `lib/shaders.ts` → `CORE_FRAG` | Removed the flat `col += gold * 0.30` lift that pushed the whole sphere over the bloom threshold. Highlight is now **fresnel-gated** — calm body, hot rim only. |
| `components/Effects.tsx` | Bloom **intensity 1.05 → 0.72**, **threshold 0.18 → 0.42**, **radius 0.8 → 0.7**. Slightly softer vignette/noise. A contained, defined glow instead of a flashlight. |
| `components/Core.tsx` | Inner sphere **#ffce8a (near-white) → #ffbf57 (warm amber)** and a touch smaller (5.3 → 4.7); halo base **60 → 38** and opacity **0.9 → 0.6**. |
| `components/Logo.tsx` *(new)* | The real nested-chevron mark from `Final LLM 1.svg`, as a reusable React component. Outer fills lightened so it reads on the dark bg. |
| `components/Overlay.tsx` | HUD brand now shows the **chevron logo** lockup; added a `.scrim` radial layer behind the beats for legible headlines. |
| `components/Preloader.tsx` | Replaced the "L L M" letters with the **chevron mark**. |
| `app/globals.css` | Added `.scrim`, headline `text-shadow`, brand-lockup + preloader-mark styles. |

`page.tsx` and `lib/scenes.ts` are unchanged (the scrim lives inside `Overlay`).

## How to apply
Copy each file over its counterpart in the repo, keeping the same paths:

```
fixed-src/components/Logo.tsx        ->  components/Logo.tsx   (new file)
fixed-src/components/Core.tsx        ->  components/Core.tsx
fixed-src/components/Effects.tsx     ->  components/Effects.tsx
fixed-src/components/Overlay.tsx     ->  components/Overlay.tsx
fixed-src/components/Preloader.tsx   ->  components/Preloader.tsx
fixed-src/lib/shaders.ts             ->  lib/shaders.ts
fixed-src/app/globals.css            ->  app/globals.css
```

Then `npm run dev` and QA the six beats. The standalone `demo.html` in the project root
demonstrates the corrected Scene-1 look (contained core, readable headline, chevron logo)
and needs no build.

## Still worth doing (from the handoff polish list)
- Per-tier performance: drop `COUNT` ~9k and disable CA on mobile/low-GPU.
- Floating 3D lead labels ("Site Visit Request", "₹5L") in Scene 1.
- Core "ingestion" moment (Scene 3 → 4): pull a few labelled leads in, emit gold tokens out.
- Skyline towers that *build upward* on entry rather than appear.
