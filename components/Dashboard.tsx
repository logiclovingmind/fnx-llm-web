'use client';

import { useEffect, useRef, useState } from 'react';

// The fourth automation beat — everything the AI did, at a glance. Numbers count
// up and the week's bars rise on view, then loop: the "control room" payoff that
// makes the agent feel on top of every lead without lifting a finger.
const STATS = [
  { label: 'Buyers answered', to: 128, suffix: '' },
  { label: 'Visits booked', to: 34, suffix: '' },
  { label: 'Avg reply', to: 4, suffix: 's' },
  { label: 'Became visits', to: 27, suffix: '%' },
];
const BARS = [44, 58, 50, 72, 63, 88, 96]; // % heights, Mon→Sun
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Dashboard() {
  const [vals, setVals] = useState(STATS.map(() => 0));
  const [grown, setGrown] = useState(false);
  const raf = useRef<number>();

  useEffect(() => {
    const DUR = 1300;
    const run = () => {
      setGrown(false);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DUR);
        const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setVals(STATS.map((s) => Math.round(s.to * e)));
        if (t < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      requestAnimationFrame(() => setGrown(true));
    };
    run();
    const loop = setInterval(run, 6000);
    return () => {
      clearInterval(loop);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div className="dash" aria-hidden>
      <div className="dash-top">
        <span className="dash-title">Today · Overview</span>
        <span className="dash-live"><i /> Live</span>
      </div>

      <div className="dash-stats">
        {STATS.map((s, i) => (
          <div className="dash-cell" key={s.label}>
            <b>{vals[i]}{s.suffix}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="dash-chart">
        <div className="dash-chart-head">
          <span>Messages · this week</span>
          <span className="up">▲ 32%</span>
        </div>
        <div className="dash-bars">
          {BARS.map((h, i) => (
            <div className="dash-bar" key={i}>
              <span className="bar" style={{ height: grown ? `${h}%` : '0%', transitionDelay: `${i * 70}ms` }} />
              <em>{DAYS[i]}</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
