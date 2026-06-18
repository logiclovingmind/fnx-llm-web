'use client';

import { useEffect, useRef, useState } from 'react';
import { SCENES, BRAND } from '@/lib/scenes';
import { useExperience } from '@/lib/store';
import Logo from './Logo';

// Same buyer intent — "is it available, can I view Saturday?" — arriving the three
// ways a real Indian agency actually fields it: English, Hinglish, and Gujarati
// typed in the Latin alphabet. The AI answers in the buyer's own language: the
// multilingual proof point.
const CHATS: { q: string; a: string }[] = [
  {
    q: 'Hi, saw your 3 BHK in Bandra. Still available? Can I come see it Saturday?',
    a: "Yes, still up! I'm free Saturday 11 or 2, whichever suits you. Shall I keep a slot?",
  },
  {
    q: 'Namaste, Dwarka wala 3 BHK abhi khali hai kya? Saturday ko dekhne aa sakta hu?',
    a: 'Ji bilkul! Saturday ko 11 baje ya 2 baje aa jaiye, jo time theek lage bata dijiye, main rakh leta hu.',
  },
  {
    q: 'Namaste, Bopal no 3 BHK haji male chhe? Saturday e jova aavu to chale?',
    a: 'Ha chokkas! Saturday e 11 vagye ke bapore 2 vagye aavo, tamne fave e time kaho, hu rakhi laun.',
  },
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// flat-top window: full opacity between a..b, soft edges of width f
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const CORE = SCENES.find((s) => s.id === 'core')!;

export default function Overlay() {
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const idx = useRef<HTMLSpanElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState(0);

  // cycle the proof card through the languages, in step with the typing→reply
  // loop (7.5s) so each buyer gets a full ask-and-answer beat
  useEffect(() => {
    const id = setInterval(() => setLang((i) => (i + 1) % CHATS.length), 7500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = useExperience.getState().progress;

      SCENES.forEach((s, i) => {
        const el = blocks.current[i];
        if (!el) return;
        const f = 0.05; // edge softness
        const isLast = i === SCENES.length - 1;
        // the final beat holds its CTA solid at the bottom — never fades out
        const o = isLast
          ? smooth(s.a, s.a + f, p)
          : smooth(s.a, s.a + f, p) - smooth(s.b - f, s.b, p);
        // raise copy clear of the core orb on the mid beats; the finale has no
        // orb (just the low city band) so it only needs a gentle lift, otherwise
        // the tall CTA block floats off the top of the frame.
        const off = s.id === 'skyline' ? -5 : s.lift ? -15 : 0;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate(-50%, calc(-50% + ${off}vh + ${(1 - o) * 22}px))`;
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      });

      // the WhatsApp proof card rides the intelligence beat, sitting on the orb
      if (chat.current) {
        const f = 0.05;
        const co = smooth(CORE.a, CORE.a + f, p) - smooth(CORE.b - f, CORE.b, p);
        chat.current.style.opacity = co.toFixed(3);
        chat.current.style.transform = `translate(-50%, calc(-50% + ${(1 - co) * 26}px))`;
      }

      if (bar.current) bar.current.style.transform = `scaleY(${p})`;
      if (idx.current) {
        // active beat = nearest window center
        const active = SCENES.reduce((best, s, i) => {
          const c = (s.a + s.b) / 2;
          const bc = (SCENES[best].a + SCENES[best].b) / 2;
          return Math.abs(p - c) < Math.abs(p - bc) ? i : best;
        }, 0);
        idx.current.textContent = String(active + 1).padStart(2, '0');
      }
      if (hint.current) hint.current.style.opacity = p < 0.02 ? '0.7' : '0';

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="overlay">
      {/* readable radial scrim behind the centered beats */}
      <div className="scrim" aria-hidden />

      {/* fixed HUD — brand lockup with the chevron mark */}
      <div className="hud brand">
        <Logo size={30} className="logo" />
        <div className="brand-txt">
          {BRAND.name}
          <small>Real Estate · Intelligence · Automation</small>
        </div>
      </div>

      <div className="hud progress">
        <span className="idx" ref={idx}>
          01
        </span>
        <span className="of">/ 07</span>
        <div className="track">
          <div className="fill" ref={bar} />
        </div>
      </div>

      <div className="hud scroll-hint" ref={hint}>
        <span>Scroll to enter the world</span>
        <i />
      </div>

      {/* the conversation flows through the core: a buyer's enquiry drifts in
          from the left, the AI's answer ignites out of the orb on the right */}
      <div className="chatflow" ref={chat} aria-hidden>
        <div className="flow-q" key={'q' + lang}>
          <span className="flow-tag">New enquiry</span>
          <span className="bub in">{CHATS[lang].q}</span>
        </div>
        <div className="flow-a" key={'a' + lang}>
          <div className="ch-out">
            <span className="bub out">{CHATS[lang].a}</span>
            <span className="ch-typing">
              <i />
              <i />
              <i />
            </span>
          </div>
          <span className="flow-cap">Logic Loving Mind AI · replied in 4s · any language</span>
        </div>
      </div>

      {/* narrative beats */}
      {SCENES.map((s, i) => (
        <div
          className={`beat ${s.id}`}
          key={s.id}
          ref={(el) => {
            blocks.current[i] = el;
          }}
        >
          <div className="beat-head">
            <div className="kicker">{s.kicker}</div>
            <h2 dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
          </div>
          <p>{s.body}</p>

          {s.id === 'skyline' && (
            <div className="outcome-stats">
              <span>
                <b>24/7</b> always answering
              </span>
              <span>
                <b>365</b> days a year
              </span>
              <span>
                <b>weekends</b> included
              </span>
              <span>
                <b>~3 hrs</b> of busywork saved daily
              </span>
            </div>
          )}

          {s.id === 'skyline' && (
            <a
              className="cta"
              href="mailto:logiclovingmind@gmail.com?subject=Automation%20Strategy%20Call"
            >
              {BRAND.cta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h9M8 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
