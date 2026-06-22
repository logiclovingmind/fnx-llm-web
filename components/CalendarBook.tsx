'use client';

import { useEffect, useState } from 'react';

// Third automation beat: the same booked viewing drops itself onto the agent's
// calendar at the agreed slot — Saturday 11:00 — and fires the invite. No manual
// scheduling, no double-booking.
const DAYS = [
  { d: 'THU', n: 18 },
  { d: 'FRI', n: 19 },
  { d: 'SAT', n: 20, hot: true },
  { d: 'SUN', n: 21 },
];
const SLOTS = ['10:00', '11:00', '12:00'];

export default function CalendarBook() {
  // 0 idle → 1 event placed → 2 confirmed (invite sent)
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setPhase(0);
      timers.push(setTimeout(() => setPhase(1), 1000));
      timers.push(setTimeout(() => setPhase(2), 2200));
    };
    run();
    const loop = setInterval(run, 6400);
    return () => {
      clearInterval(loop);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="cal" aria-hidden>
      <div className="cal-top">
        <span className="cal-month">June 2026</span>
        <span className={`cal-sync ${phase >= 1 && phase < 2 ? 'on' : ''}`}>
          <i /> {phase >= 2 ? 'Invite sent' : 'Booking…'}
        </span>
      </div>

      <div className="cal-week">
        {DAYS.map((d) => (
          <div className={`cal-day ${d.hot ? 'hot' : ''}`} key={d.d}>
            <span className="cd">{d.d}</span>
            <span className="cn">{d.n}</span>
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {SLOTS.map((t) => (
          <div className="cal-slot" key={t}>
            <span className="ct">{t}</span>
            <div className="cal-lane">
              {t === '11:00' && phase >= 1 && (
                <div className={`cal-event ${phase >= 2 ? 'confirmed' : ''}`}>
                  <strong>Site visit · Rohan S.</strong>
                  <span>Dwarka 3 BHK · 11:00–11:30</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`cal-cap ${phase >= 2 ? 'in' : ''}`}>
        Visit booked. Invite sent to the buyer.
      </div>
    </div>
  );
}
