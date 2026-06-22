'use client';

import { useEffect, useRef, useState } from 'react';
import { waHref } from '@/components/homeShared';

// Mobile-only floating "Book a demo" pill. It hides once the final CTA section
// (which carries its own Book-a-demo button) scrolls into view, so the bottom of
// the page never shows two booking buttons at once.
export default function FloatingCta() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // the mobile final section is the visible one (its desktop twin is display:none
    // → zero-size → never reports as intersecting, so watching all is safe)
    const finals = document.querySelectorAll('.final');
    if (!finals.length) return;
    const io = new IntersectionObserver(
      (entries) => setHidden(entries.some((e) => e.isIntersecting)),
      { threshold: 0 }
    );
    finals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      className={`cta-float btn btn-primary ${hidden ? 'cta-float--gone' : ''}`}
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="btn-label">Book a demo</span>
    </a>
  );
}
