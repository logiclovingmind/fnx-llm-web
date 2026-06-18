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
      {/* real chevron mark — rings ignite outer -> gold core (inward reveal) */}
      <div className="pl-mark">
        <span className="pl-glow" />
        <Logo size={64} ringClass="plr" />
      </div>
      <div className="pl-word">Logic Loving Mind</div>
      <div className="pl-sub">Building your intelligence</div>
      <div className="pl-bar">
        <i />
      </div>
    </div>
  );
}
