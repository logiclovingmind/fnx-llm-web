import CountUp from '@/components/CountUp';

const CELLS = [
  { v: '24/7', l: 'always answering' },
  { v: '365', l: 'days a year' },
  { v: '~4s', l: 'average reply' },
  { v: '~3 hrs', l: 'of work saved a day' },
];

export default function Stats() {
  return (
    <div className="stats">
      {CELLS.map((c) => (
        <div className="stat-cell" key={c.l}>
          <CountUp value={c.v} className="stat-num" />
          <span>{c.l}</span>
        </div>
      ))}
    </div>
  );
}
