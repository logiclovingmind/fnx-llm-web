'use client';

import { useEffect, useState } from 'react';

// The automation payoff: the moment the chatbot books a viewing, the lead is
// written into the agent's sheet — no copy-paste, no missed entry. A new row
// flows in cell-by-cell, then lands as a logged, qualified lead.
type Row = { name: string; channel: 'WhatsApp' | 'Instagram'; property: string; visit: string; status: string };

const PRIOR: Row[] = [
  { name: 'Aisha K.', channel: 'Instagram', property: 'Bandra 2 BHK', visit: 'Fri 5:00', status: 'Booked' },
  { name: 'Vikram J.', channel: 'WhatsApp', property: 'Powai 3 BHK', visit: 'Sun 12:30', status: 'Booked' },
];

const NEW: Row = { name: 'Rohan S.', channel: 'WhatsApp', property: 'Dwarka 3 BHK', visit: 'Sat 11:00', status: 'New' };

const COLS = ['name', 'channel', 'property', 'visit', 'status'] as const;

export default function SheetSync() {
  // 0 idle → 1..5 cells filling → 6 row logged
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setFill(0);
      COLS.forEach((_, i) => timers.push(setTimeout(() => setFill(i + 1), 900 + i * 520)));
      timers.push(setTimeout(() => setFill(6), 900 + COLS.length * 520 + 200));
    };
    run();
    const loop = setInterval(run, 7200);
    return () => {
      clearInterval(loop);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="sheet" aria-hidden>
      <div className="sheet-top">
        <span className="sheet-dots"><i /><i /><i /></span>
        <span className="sheet-name">New buyers · Live</span>
        <span className={`sheet-sync ${fill > 0 && fill < 6 ? 'on' : ''}`}>
          <i /> {fill >= 6 ? 'Synced' : 'Syncing…'}
        </span>
      </div>

      <div className="sheet-grid">
        <div className="srow shead">
          <span className="snum" />
          <span>Name</span>
          <span>From</span>
          <span>Property</span>
          <span>Visit</span>
          <span>Status</span>
        </div>

        {PRIOR.map((r, i) => (
          <div className="srow" key={r.name}>
            <span className="snum">{i + 1}</span>
            <span>{r.name}</span>
            <span className={`ch ch--${r.channel.toLowerCase()}`}>{r.channel}</span>
            <span>{r.property}</span>
            <span>{r.visit}</span>
            <span><em className="pill pill--done">{r.status}</em></span>
          </div>
        ))}

        <div className={`srow snew ${fill > 0 ? 'lit' : ''} ${fill >= 6 ? 'logged' : ''}`}>
          <span className="snum">{PRIOR.length + 1}</span>
          <span className={fill >= 1 ? 'cell in' : 'cell'}>{fill >= 1 ? NEW.name : ''}</span>
          <span className={fill >= 2 ? 'cell in' : 'cell'}>
            {fill >= 2 ? <em className={`ch ch--${NEW.channel.toLowerCase()}`}>{NEW.channel}</em> : ''}
          </span>
          <span className={fill >= 3 ? 'cell in' : 'cell'}>{fill >= 3 ? NEW.property : ''}</span>
          <span className={fill >= 4 ? 'cell in' : 'cell'}>{fill >= 4 ? NEW.visit : ''}</span>
          <span className={fill >= 5 ? 'cell in' : 'cell'}>
            {fill >= 5 ? <em className="pill pill--hot">{NEW.status}</em> : ''}
          </span>
        </div>
      </div>

      <div className={`sheet-cap ${fill >= 6 ? 'in' : ''}`}>
        Saved automatically. No typing.
      </div>
    </div>
  );
}
