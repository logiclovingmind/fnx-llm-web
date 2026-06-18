'use client';

import { useEffect, useRef } from 'react';
import { useExperience } from '@/lib/store';
import { emitFlood } from '@/lib/ingest';

// The human-frailty beat: every reason a person misses a lead, listed plainly and
// then erased. As the visitor scrolls through the "Human vs. Machine" window each
// line shatters into real WebGL particles (the same Ingest system the hero feeds),
// leaving only the AI's promise. Scroll-driven, so it reverses cleanly if they
// scroll back up.
// A small gold lead anchors the subject so the frailties aren't an orphaned
// "they" — it reads as one sentence: "Even your best agent … sleeps, eats,
// forgets …" which the next beat answers with "Your AI does none of that."
const LEAD = 'Even your best team';
const LIMITS = [
  'Sleeps.',
  'Eats.',
  'Forgets.',
  'Panics.',
  'Clocks out at 6.',
  'Off all weekend.',
];

// visibility ramp + the scroll range over which the lines shatter, top-to-bottom.
// the beat now owns a wider scroll window so it reads as a deliberate, scroll-
// driven sequence rather than a flash: the lines fade in with dwell (0.45→0.50),
// shatter one by one (0.50→0.546), and the gold subject line dissolves last
// (~0.555) — all clearing the stage just before "Your AI does none of that."
// rises at 0.56.
const VIS_IN = 0.45;
const SHATTER_A = 0.5;
const SHATTER_END = 0.555;
const VIS_OUT = 0.6;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export default function HumanLimits() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = layer.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lead = document.createElement('div');
    lead.className = 'limit-lead';
    lead.textContent = LEAD;
    root.appendChild(lead);

    const words = LIMITS.map((t, i) => {
      const el = document.createElement('div');
      el.className = 'limit-word';
      el.textContent = t;
      root.appendChild(el);
      // lines shatter top-to-bottom, spread across the window so each one breaks
      // on its own clear slice of scroll; the gold subject dissolves last.
      const threshold = SHATTER_A + (SHATTER_END - SHATTER_A) * (i / LIMITS.length);
      return { el, threshold, gone: false };
    });
    words.push({ el: lead, threshold: SHATTER_END, gone: false });

    let raf = 0;
    const frame = () => {
      const p = useExperience.getState().progress;
      const active = p > VIS_IN - 0.04 && p < VIS_OUT + 0.04;
      root.style.visibility = active ? 'visible' : 'hidden';

      if (active) {
        const vis = Math.min(
          smoothstep(VIS_IN, SHATTER_A, p),
          1 - smoothstep(VIS_OUT - 0.05, VIS_OUT, p),
        );
        root.style.opacity = clamp01(vis).toFixed(3);

        for (const w of words) {
          if (!w.gone && p >= w.threshold) {
            w.gone = true;
            w.el.classList.add('gone');
            if (!reduce) {
              const r = w.el.getBoundingClientRect();
              const n = Math.max(20, Math.min(54, Math.round((r.width * r.height) / 300)));
              emitFlood({ x: r.left, y: r.top, w: r.width, h: r.height, n });
            }
          } else if (w.gone && p < w.threshold - 0.006) {
            // scrolled back up — restore the line so the beat can replay
            w.gone = false;
            w.el.classList.remove('gone');
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      lead.remove();
      words.forEach((w) => w.el.remove());
    };
  }, []);

  return <div className="limitsfx" ref={layer} aria-hidden />;
}
