'use client';

import { useEffect, useRef, useState } from 'react';
import { useExperience } from '@/lib/store';
import Logo from './Logo';

export default function Preloader() {
  const ready = useExperience((s) => s.ready);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 1100);
    return () => clearTimeout(t);
  }, [ready]);

  if (gone) return null;

  return (
    <div className={`preloader ${ready ? 'out' : ''}`} ref={root}>
      {/* real chevron mark instead of the "L L M" letters */}
      <div className="pl-mark">
        <Logo size={64} />
      </div>
      <div className="pl-word">Logic Loving Mind</div>
      <div className="pl-sub">Building your intelligence</div>
      <div className="pl-bar">
        <i />
      </div>
    </div>
  );
}
