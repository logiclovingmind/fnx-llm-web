'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useExperience } from '@/lib/store';

export default function SmoothScroll() {
  const setProgress = useExperience((s) => s.setProgress);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on('scroll', ({ scroll, limit }: { scroll: number; limit: number }) => {
      setProgress(limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0);
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [setProgress]);

  return null;
}
