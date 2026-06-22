'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Logo from './Logo';

// The automation spine. A subtle rail threads each stage centre
// (chat → sheet → calendar → dashboard) and fills with the brand gradient as you
// scroll. At every stage the line touches the card's top edge, SPLITS into two
// branches that wrap down both sides and rejoin at the bottom — framing the whole
// card — then crosses the gap to the next stage. One connected, immersive flow.
const CARD_SELECTOR = '.chat, .sheet, .cal, .dash';
// each drawable piece of the spine: its path + the scroll band [start,end] (as a
// fraction of the whole spine) over which it fills. The two halves of a card share
// one band so they light up together — a true split.
type Seg = { d: string; start: number; end: number; kind: 'branch' | 'connector' };

const f = (n: number) => n.toFixed(1);
// how filled a segment is at a given overall progress (0..1)
const fill = (s: Seg, prog: number) =>
  Math.max(0, Math.min(1, (prog - s.start) / Math.max(1e-4, s.end - s.start)));

export default function FlowLine() {
  // unique per instance so the desktop + mobile FlowLines don't share a gradient
  // id (a duplicate id makes one resolve to the hidden tree's paint server → no fill)
  const gradId = `flowgrad-${useId().replace(/:/g, '')}`;
  const ref = useRef<HTMLDivElement>(null);
  // static geometry of the spine within the container — only changes on layout,
  // never on scroll, so the scroll handler stays cheap (no card re-measuring).
  const anchor = useRef({ firstY: 0, span: 1 });
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [segs, setSegs] = useState<Seg[]>([]);
  // scroll updates the fill imperatively (mutate each path's dashoffset) instead
  // of via React state — re-rendering every SVG path each scroll frame is what
  // made it stutter on mobile. Keep the bands + path nodes in refs for the tick.
  const segsRef = useRef<Seg[]>([]);
  const drawRefs = useRef<(SVGPathElement | null)[]>([]);
  const tickRef = useRef<() => void>(() => {});
  // last computed scroll progress — lets freshly re-measured paths mount already
  // filled to the right amount instead of flashing empty for a frame
  const progRef = useRef(0);

  // ── the "lead" protagonist ──────────────────────────────────────────────
  // a single glowing orb is born in the hero chat and rides the centre spine as
  // you scroll, diving behind each stage and lighting it up on arrival. The spine
  // is an invisible centreline path (top→bottom of each card + the connectors);
  // we sample it with getPointAtLength to place the orb at the scroll head.
  // the spine is split into the SAME pieces as the draw — one straight run per
  // card and one curved connector per gap — each with its own scroll band. The
  // orb is placed at the active piece's band-fill, so it sits EXACTLY on the
  // drawn line's leading tip (a single global arc-length param drifts off the tip
  // because a curved connector's length ≠ its vertical extent).
  type SpineSeg = { d: string; start: number; end: number };
  const [spineSegs, setSpineSegs] = useState<SpineSeg[]>([]);
  const spineSegsRef = useRef<SpineSeg[]>([]);
  const spineSegRefs = useRef<(SVGPathElement | null)[]>([]);
  const spineLensRef = useRef<number[]>([]);
  const orbRef = useRef<HTMLDivElement>(null);
  // precomputed orb path samples (prog → point + angle). Built once per layout so
  // the scroll tick never calls getPointAtLength (that per-frame SVG geometry work
  // is what stuttered on phones); the tick just interpolates this table.
  const orbTableRef = useRef<{ prog: number; x: number; y: number; ang: number }[]>([]);
  // each card + the scroll band it occupies, so we can toggle its "lit" class as
  // the lead passes through
  const cardBandsRef = useRef<{ el: HTMLElement; start: number; end: number }[]>([]);

  useEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;

    // card position relative to the container using offset geometry, which
    // (unlike getBoundingClientRect) IGNORES CSS transforms. The cards sit inside
    // Reveal wrappers that animate in with translateY(20px); measuring with the
    // rect would read them mid-animation and the wrap would snap to the edges once
    // they settle. offsetTop/offsetLeft give the stable, settled layout box.
    const relTo = (el: HTMLElement) => {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== container) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { x, y };
    };

    // heavy pass: re-walk the cards and rebuild the wrap geometry. Runs on
    // mount + resize, NOT on every scroll frame.
    const measure = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      const cards = Array.from(container.querySelectorAll(CARD_SELECTOR)) as HTMLElement[];
      if (!cards.length) {
        setDims({ w, h });
        setSegs([]);
        return;
      }

      // frame each card just outside its edge so the wrap clearly rings it.
      const out = 7;
      type Box = { cx: number; L: number; R: number; T: number; B: number; r: number };
      const boxes: Box[] = cards.map((c) => {
        const { x: left, y: top } = relTo(c);
        const cw = c.offsetWidth;
        const ch = c.offsetHeight;
        const cs = getComputedStyle(c);
        const radius = parseFloat(cs.borderTopLeftRadius) || 16;
        const L = left - out;
        const R = left + cw + out;
        const T = top - out;
        const B = top + ch + out;
        const rr = Math.min(radius + out, (R - L) / 2, (B - T) / 2);
        return { cx: left + cw / 2, L, R, T, B, r: rr };
      });

      const firstY = boxes[0].T;
      const lastY = boxes[boxes.length - 1].B;
      const span = Math.max(1, lastY - firstY);
      anchor.current = { firstY, span };

      const frac = (y: number) => (y - firstY) / span;
      const out2: Seg[] = [];

      // centreline spine pieces the orb rides: a straight run down each card, then
      // a curved connector across the gap — each tagged with the same band the
      // matching draw piece uses, so the orb tracks the drawn tip exactly.
      const spineParts: SpineSeg[] = [];
      boxes.forEach((b, i) => {
        spineParts.push({
          start: frac(b.T),
          end: frac(b.B),
          d: `M ${f(b.cx)} ${f(b.T)} L ${f(b.cx)} ${f(b.B)}`,
        });
        const nxt = boxes[i + 1];
        if (nxt) {
          const midY = (b.B + nxt.T) / 2;
          spineParts.push({
            start: frac(b.B),
            end: frac(nxt.T),
            d: `M ${f(b.cx)} ${f(b.B)} C ${f(b.cx)} ${f(midY)}, ${f(nxt.cx)} ${f(midY)}, ${f(nxt.cx)} ${f(nxt.T)}`,
          });
        }
      });
      cardBandsRef.current = cards.map((c, i) => ({
        el: c,
        start: frac(boxes[i].T),
        end: frac(boxes[i].B),
      }));

      boxes.forEach((b, i) => {
        const start = frac(b.T);
        const end = frac(b.B);
        // left branch: top-centre → around the left side → bottom-centre
        out2.push({
          start,
          end,
          kind: 'branch',
          d:
            `M ${f(b.cx)} ${f(b.T)}` +
            ` L ${f(b.L + b.r)} ${f(b.T)}` +
            ` Q ${f(b.L)} ${f(b.T)} ${f(b.L)} ${f(b.T + b.r)}` +
            ` L ${f(b.L)} ${f(b.B - b.r)}` +
            ` Q ${f(b.L)} ${f(b.B)} ${f(b.L + b.r)} ${f(b.B)}` +
            ` L ${f(b.cx)} ${f(b.B)}`,
        });
        // right branch: mirror down the right side
        out2.push({
          start,
          end,
          kind: 'branch',
          d:
            `M ${f(b.cx)} ${f(b.T)}` +
            ` L ${f(b.R - b.r)} ${f(b.T)}` +
            ` Q ${f(b.R)} ${f(b.T)} ${f(b.R)} ${f(b.T + b.r)}` +
            ` L ${f(b.R)} ${f(b.B - b.r)}` +
            ` Q ${f(b.R)} ${f(b.B)} ${f(b.R - b.r)} ${f(b.B)}` +
            ` L ${f(b.cx)} ${f(b.B)}`,
        });
        // connector: rejoin at this card's bottom, cross the gap to the next top
        const next = boxes[i + 1];
        if (next) {
          const midY = (b.B + next.T) / 2;
          out2.push({
            start: frac(b.B),
            end: frac(next.T),
            kind: 'connector',
            d:
              `M ${f(b.cx)} ${f(b.B)}` +
              ` C ${f(b.cx)} ${f(midY)}, ${f(next.cx)} ${f(midY)}, ${f(next.cx)} ${f(next.T)}`,
          });
        }
      });

      segsRef.current = out2;
      spineSegsRef.current = spineParts;
      setDims({ w, h });
      setSegs(out2);
      setSpineSegs(spineParts);
    };

    // light pass: one getBoundingClientRect, then mutate each fill path's
    // strokeDashoffset directly — no React render, so it stays smooth at 60fps
    // even on mobile.
    const tick = () => {
      // ── READ PHASE — all layout reads up front, before any style writes, so a
      // write never invalidates layout for a later read (that forced reflow each
      // frame is what made scrolling micro-stutter on phones) ──────────────────
      const cRect = container.getBoundingClientRect();
      const { firstY, span } = anchor.current;
      const prog = Math.max(0, Math.min(1, (window.innerHeight * 0.62 - cRect.top - firstY) / span));
      progRef.current = prog;

      // orb position via the precomputed lookup table — pure interpolation, no
      // getPointAtLength on the scroll path (that SVG geometry call every frame is
      // what stuttered on phones)
      const table = orbTableRef.current;
      let orbTransform: string | null = null;
      if (table.length) {
        const first = table[0];
        const last = table[table.length - 1];
        let x = first.x;
        let y = first.y;
        let ang = first.ang;
        if (prog >= last.prog) {
          x = last.x;
          y = last.y;
          ang = last.ang;
        } else if (prog > first.prog) {
          for (let i = 1; i < table.length; i++) {
            if (table[i].prog >= prog) {
              const a = table[i - 1];
              const b = table[i];
              const t = (prog - a.prog) / Math.max(1e-4, b.prog - a.prog);
              x = a.x + (b.x - a.x) * t;
              y = a.y + (b.y - a.y) * t;
              ang = a.ang + (b.ang - a.ang) * t;
              break;
            }
          }
        }
        orbTransform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`;
      }
      // which stages are lit / whether the orb is currently inside a card
      const bands = cardBandsRef.current;
      const litStates: boolean[] = [];
      let inside = false;
      for (let i = 0; i < bands.length; i++) {
        const bd = bands[i];
        litStates[i] = prog >= bd.start - 0.004;
        if (prog > bd.start + 0.01 && prog < bd.end - 0.01) inside = true;
      }

      // ── WRITE PHASE — only style mutations from here, no reads ───────────────
      const arr = segsRef.current;
      const els = drawRefs.current;
      for (let i = 0; i < arr.length; i++) {
        const el = els[i];
        if (el) el.style.strokeDashoffset = String(1 - fill(arr[i], prog));
      }
      const orb = orbRef.current;
      if (orb) {
        if (orbTransform) orb.style.transform = orbTransform;
        const live = prog > 0.0005 && prog < 0.9995;
        orb.style.opacity = live ? (inside ? '0.18' : '1') : '0';
      }
      for (let i = 0; i < bands.length; i++) {
        bands[i].el.classList.toggle('lead-lit', litStates[i]);
      }
    };
    tickRef.current = tick;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      measure();
      tick();
    };

    measure();
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // the chat card grows as messages type in and fonts swap, which shifts every
    // card below it. Re-measure whenever the container's box changes so the wrap
    // stays locked to the card edges.
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      let mraf = 0;
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(mraf);
        mraf = requestAnimationFrame(() => {
          measure();
          tick();
        });
      });
      ro.observe(container);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, []);

  // once new segment paths mount, apply the current fill immediately so they
  // don't flash empty before the next scroll frame
  useEffect(() => {
    tickRef.current();
  }, [segs]);

  // measure each spine piece's length whenever geometry changes, then place the orb
  useEffect(() => {
    spineLensRef.current = spineSegRefs.current.map((p) => (p ? p.getTotalLength() : 0));
    // sample every spine piece into a prog→point table ONCE here (all the heavy
    // getPointAtLength calls live in this layout effect, not the scroll tick)
    const meta = spineSegsRef.current;
    const parts = spineSegRefs.current;
    const lens = spineLensRef.current;
    const table: { prog: number; x: number; y: number; ang: number }[] = [];
    const STEPS = 22;
    meta.forEach((seg, i) => {
      const path = parts[i];
      const len = lens[i] || 0;
      if (!path || len <= 0) return;
      for (let s = 0; s <= STEPS; s++) {
        const fr = s / STEPS;
        const l = fr * len;
        const pt = path.getPointAtLength(l);
        // tangent (sampled top→bottom so it never flips): 90° straight down → upright
        const p1 = path.getPointAtLength(Math.max(0, l - 1));
        const p2 = path.getPointAtLength(Math.min(len, l + 1));
        const ang = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI - 90;
        table.push({ prog: seg.start + (seg.end - seg.start) * fr, x: pt.x, y: pt.y, ang });
      }
    });
    table.sort((a, b) => a.prog - b.prog);
    orbTableRef.current = table;
    tickRef.current();
  }, [spineSegs, dims]);

  return (
    <div className="flow-line" ref={ref} aria-hidden>
      <svg className="flow-svg" width={dims.w} height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`} fill="none">
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={dims.h || 1}>
            <stop offset="0" stopColor="#7a3df0" />
            <stop offset="0.6" stopColor="#b5511f" />
            <stop offset="1" stopColor="#e08a16" />
          </linearGradient>
        </defs>
        {/* faint always-on outline only frames the cards (branches); the connectors
            carry no pre-line so nothing sits ahead of the lead — the logo is the
            leading tip of the drawn line, not a mark the rail passes through */}
        {segs.map((s, i) =>
          s.kind === 'branch' ? <path key={`t${i}`} className="flow-track" d={s.d} /> : null,
        )}
        {segs.map((s, i) => (
          <path
            key={`d${i}`}
            ref={(el) => {
              drawRefs.current[i] = el;
            }}
            className={`flow-draw flow-draw--${s.kind}`}
            d={s.d}
            stroke={`url(#${gradId})`}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - fill(s, progRef.current)}
          />
        ))}
        {/* invisible centreline pieces — sampled to position the lead orb on the
            drawn tip, never painted */}
        {spineSegs.map((s, i) => (
          <path
            key={`s${i}`}
            className="flow-spine"
            ref={(el) => {
              spineSegRefs.current[i] = el;
            }}
            d={s.d}
          />
        ))}
      </svg>

      {/* the lead: the brand mark itself rides the spine as one protagonist */}
      <div className="lead-orb" ref={orbRef} style={{ opacity: 0 }}>
        <Logo size={30} />
      </div>
    </div>
  );
}
