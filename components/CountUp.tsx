'use client';

import { useEffect, useRef, useState } from 'react';

// Animate a stat from 0 up to its number when it scrolls into view. Values can
// carry non-numeric chrome ("~4s", "~3 hrs", "24/7"); we count the first integer
// and keep the surrounding prefix/suffix fixed.
function parse(value: string) {
  const m = value.match(/\d+/);
  if (!m || m.index === undefined) return { prefix: value, target: 0, suffix: '', hasNum: false };
  return {
    prefix: value.slice(0, m.index),
    target: parseInt(m[0], 10),
    suffix: value.slice(m.index + m[0].length),
    hasNum: true,
  };
}

export default function CountUp({ value, className }: { value: string; className?: string }) {
  const { prefix, target, suffix, hasNum } = parse(value);
  const [n, setN] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!hasNum) return;
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setN(target);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e.isIntersecting || done.current) return;
        done.current = true;
        const dur = 1300;
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic — fast, then settle
          setN(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      // fire only once the stat has climbed into the upper ~60% of the viewport
      // (not the moment it peeks in at the bottom edge) so the count animates as
      // you actually reach it, instead of finishing before it's in focus
      { threshold: 0, rootMargin: '0px 0px -40% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNum, target]);

  return (
    <b className={className} ref={ref}>
      {hasNum ? `${prefix}${n}${suffix}` : value}
    </b>
  );
}
