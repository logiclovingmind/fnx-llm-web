'use client';

import dynamic from 'next/dynamic';
import Overlay from '@/components/Overlay';
import SmoothScroll from '@/components/SmoothScroll';
import Preloader from '@/components/Preloader';

// WebGL is client-only; never SSR the Canvas.
const Experience = dynamic(() => import('@/components/Experience'), { ssr: false });
// Hero enquiries + canvas dissolve are client-only (window/canvas access).
const HeroBubbles = dynamic(() => import('@/components/HeroBubbles'), { ssr: false });
// The "human vs. machine" frailty lines that shatter into the field mid-journey.
const HumanLimits = dynamic(() => import('@/components/HumanLimits'), { ssr: false });

export default function Page() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Experience />
      <HeroBubbles />
      <HumanLimits />
      <Overlay />

      {/* film overlays */}
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />

      {/* scroll height that drives the journey */}
      <div className="scroll-spacer" aria-hidden />
    </>
  );
}
