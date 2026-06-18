'use client';

import { useEffect, useRef } from 'react';
import { useExperience } from '@/lib/store';
import { emitFlood } from '@/lib/ingest';

// Short buyer enquiries — the same intent ("still available, can I view?") in the
// three ways an Indian agency actually gets them: English, Hinglish, and Gujarati
// typed in the Latin alphabet. Each bubble is one incoming lead; when it dissolves
// it emits real WebGL particles that fly into and merge with the cosmos
// (see components/Ingest.tsx).
type Channel = 'whatsapp' | 'instagram';
const MSGS: { channel: Channel; place: string; text: string }[] = [
  { channel: 'whatsapp', place: 'Bandra', text: 'Hi, 3 BHK still available? Can I view Saturday?' },
  { channel: 'whatsapp', place: 'Dwarka', text: 'Dwarka wala 3 BHK abhi khali hai kya?' },
  { channel: 'instagram', place: 'Bopal', text: 'Bopal no 3 BHK haji male chhe? Jova aavu?' },
  { channel: 'whatsapp', place: 'Powai', text: 'Powai wala flat available hai? Rate kya hai?' },
  { channel: 'instagram', place: 'Satellite', text: 'Satellite ma 2 BHK chhe? Price ketli?' },
  { channel: 'whatsapp', place: 'Andheri', text: 'Price for the 2 BHK? Any home-loan help?' },
  { channel: 'instagram', place: 'Indiranagar', text: 'Is the listing still open? Can we talk?' },
  { channel: 'whatsapp', place: 'Vastrapur', text: 'Vastrapur no flat ketla no chhe? Loan male?' },
  { channel: 'whatsapp', place: 'Saket', text: 'Saket wala flat dekhne Saturday aa sakta hu?' },
];

// Brand glyphs drawn in currentColor so they inherit the bubble's gold tag
// styling — the recognisable WhatsApp / Instagram marks without breaking the
// luxury palette. Each lead bubble is labelled by the channel it arrived on.
const ICONS: Record<Channel, string> = {
  whatsapp:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 6.32A8 8 0 0 0 4.9 16.04L4 20l4.05-.88A8 8 0 1 0 17.6 6.32Zm-5.6 12.3a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.4.52.51-2.34-.16-.25a6.64 6.64 0 1 1 5.65 3.13Zm3.64-4.97c-.2-.1-1.18-.58-1.36-.65s-.32-.1-.45.1-.52.64-.64.78-.23.15-.43.05a5.43 5.43 0 0 1-1.6-.99 6 6 0 0 1-1.1-1.38c-.12-.2 0-.31.09-.41l.3-.35c.1-.12.13-.2.2-.34a.37.37 0 0 0-.02-.35c-.05-.1-.45-1.08-.62-1.48-.16-.39-.33-.34-.45-.34h-.39a.74.74 0 0 0-.54.25 2.26 2.26 0 0 0-.7 1.67 3.92 3.92 0 0 0 .82 2.08 9 9 0 0 0 3.46 3.05c.48.21.86.33 1.15.43.49.15.93.13 1.28.08.39-.06 1.18-.48 1.35-.95s.17-.86.12-.95-.18-.14-.38-.24Z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// The Flood, choreographed as a single cinematic build: the hero opens on one
// enquiry and the rate accelerates over ~7s into a flood of too-many-to-count,
// holds the climax, then settles to a steady ongoing flow. It never resets — the
// particle field accumulates monotonically and stays dense.
const RAMP = 7; // one message -> flood
const PEAK = 3; // hold the flood climax
const SETTLE = 4; // ease the rate down to a steady flow (field already built)
const intensity = (T: number) => {
  // accelerating but alive from the first second: a gentle quadratic, lifted off
  // zero so the rate is always perceptibly climbing, never a dead empty stretch
  if (T < RAMP) return 0.1 + 0.9 * Math.pow(T / RAMP, 2);
  if (T < RAMP + PEAK) return 1; // flood
  return lerp(1, 0.5, smoothstep(0, 1, (T - RAMP - PEAK) / SETTLE)); // -> steady 0.5
};

export default function HeroBubbles() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = layer.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = Math.min(window.innerWidth, window.innerHeight) < 720;

    // a reusable pool of bubble elements — its size caps how many flood at once
    const POOL = mobile ? 9 : 16;
    type Bubble = {
      el: HTMLDivElement;
      tag: HTMLSpanElement;
      txt: HTMLSpanElement;
      busy: boolean;
      t1: number;
      t2: number;
    };
    const pool: Bubble[] = Array.from({ length: POOL }, () => {
      const el = document.createElement('div');
      el.className = 'hero-bub';
      const tag = document.createElement('span');
      tag.className = 'htag';
      const txt = document.createElement('span');
      el.appendChild(tag);
      el.appendChild(txt);
      root.appendChild(el);
      return { el, tag, txt, busy: false, t1: 0, t2: 0 };
    });

    let msgPtr = 0;
    const nextMsg = () => MSGS[msgPtr++ % MSGS.length];
    const heroVisible = () => useExperience.getState().progress < 0.18;

    // choose a target centre (%). On phones the bubbles are wide relative to the
    // screen, so keep them in the top/bottom bands and clear of the headline;
    // desktop scatters around the central copy.
    const pickPos = () => {
      if (mobile) {
        // bottom band stops well above the centred "scroll to enter" hint so the
        // two never collide; top band stays clear of the brand lockup
        const top = Math.random() < 0.5;
        const y = top ? 11 + Math.random() * 16 : 60 + Math.random() * 14;
        const x = 38 + Math.random() * 24; // near-centre; clamp keeps it on-screen
        return { x, y };
      }
      let x = 50;
      let y = 50;
      for (let k = 0; k < 8; k++) {
        x = 6 + Math.random() * 88;
        y = 9 + Math.random() * 82;
        if (!(x > 27 && x < 73 && y > 31 && y < 69)) break;
      }
      return { x, y };
    };

    const spawnBubble = (i: number) => {
      const b = pool.find((p) => !p.busy);
      if (!b) return; // pool exhausted = natural ceiling on the flood
      b.busy = true;
      const m = nextMsg();
      b.tag.innerHTML = `${ICONS[m.channel]}<span class="hplace"></span>`;
      (b.tag.lastChild as HTMLElement).textContent = m.place;
      b.txt.textContent = m.text;
      const pos = pickPos();
      // measure the rendered bubble, then clamp its centre so the whole box stays
      // on-screen with a margin — never a half-cut bubble at the edges. On phones
      // reserve the brand lockup (top) and the scroll hint (bottom) as no-go bands.
      const pad = 12;
      const padTop = mobile ? 74 : pad;
      const padBottom = mobile ? 118 : pad;
      const halfW = b.el.offsetWidth / 2;
      const halfH = b.el.offsetHeight / 2;
      const cx = Math.min(
        Math.max((pos.x / 100) * window.innerWidth, pad + halfW),
        window.innerWidth - pad - halfW,
      );
      const cy = Math.min(
        Math.max((pos.y / 100) * window.innerHeight, padTop + halfH),
        window.innerHeight - padBottom - halfH,
      );
      b.el.style.left = cx + 'px';
      b.el.style.top = cy + 'px';
      b.el.classList.remove('out');
      void b.el.offsetWidth;
      b.el.classList.add('in');
      const hold = lerp(1900, 480, i);
      b.t1 = window.setTimeout(() => {
        // hand the message to the WebGL field: it shatters into real particles
        if (!reduce && heroVisible()) {
          const r = b.el.getBoundingClientRect();
          const n = Math.max(24, Math.min(58, Math.round((r.width * r.height) / 340)));
          emitFlood({ x: r.left, y: r.top, w: r.width, h: r.height, n });
        }
        b.el.classList.remove('in');
        b.el.classList.add('out');
        b.t2 = window.setTimeout(() => {
          b.el.classList.remove('out');
          b.busy = false;
        }, 520);
      }, hold);
    };

    let raf = 0;
    let last = performance.now();
    let T = 0; // choreography timeline (pauses when hero not visible)
    let spawnAcc = 1600; // pre-armed so the very first enquiry lands on open, not after a dead beat

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const p = useExperience.getState().progress;
      root.style.opacity = (1 - smoothstep(0.05, 0.14, p)).toFixed(3);

      if (heroVisible()) {
        T += dt;
        const i = reduce ? 0.1 : intensity(T);
        const interval = lerp(1500, 150, i);
        spawnAcc += dt * 1000;
        if (spawnAcc >= interval) {
          spawnAcc -= interval; // keep the remainder so the cadence stays even
          const burst = i > 0.8 ? 1 + Math.floor(Math.random() * 2) : 1;
          for (let k = 0; k < burst; k++) spawnBubble(i);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      pool.forEach((b) => {
        clearTimeout(b.t1);
        clearTimeout(b.t2);
        b.el.remove();
      });
    };
  }, []);

  return <div className="herofx" ref={layer} aria-hidden />;
}
