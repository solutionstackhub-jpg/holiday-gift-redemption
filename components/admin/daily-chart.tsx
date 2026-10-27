'use client';

import { useMemo, useRef, useState, type PointerEvent } from 'react';

const W = 720;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
const LINE = '#0e8a5f'; // validated: chroma and 3:1 contrast on white

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (key: string) => {
  const [, m, d] = key.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
};

/** Single-series area chart with a crosshair tooltip and a table view for screen readers. */
export default function DailyChart({ data }: { data: { day: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const { points, max, ticks, line, area } = useMemo(() => {
    const max = Math.max(4, ...data.map((d) => d.count));
    const nice = Math.ceil(max / 4) * 4;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    const points = data.map((d, i) => ({
      x: PAD.left + i * step,
      y: PAD.top + innerH - (d.count / nice) * innerH,
      ...d,
    }));
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = points.length ? `${line} L${points.at(-1)!.x},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z` : '';
    const ticks = [0, 1, 2, 3, 4].map((i) => ({ value: (nice / 4) * i, y: PAD.top + innerH - (innerH / 4) * i }));
    return { points, max: nice, ticks, line, area };
  }, [data]);

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box || points.length === 0) return;
    const x = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
    setHover(best);
  }

  const hp = hover !== null ? points[hover] : null;
  const xLabels = points.length ? [0, Math.round((points.length - 1) / 3), Math.round(((points.length - 1) * 2) / 3), points.length - 1] : [];
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="relative">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label={`Redemptions per day over the last ${data.length} days, ${total} in total, peak ${Math.max(0, ...data.map((d) => d.count))} in a day`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={LINE} stopOpacity="0.18" />
              <stop offset="1" stopColor={LINE} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t.value}>
              <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="#f0f0f1" strokeWidth="1" />
              <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill="#a1a1aa">
                {t.value}
              </text>
            </g>
          ))}
          {xLabels.map((i, n) => (
            <text
              key={`${i}-${n}`}
              x={points[i].x}
              y={H - 8}
              fontSize="11"
              fill="#a1a1aa"
              textAnchor={n === 0 ? 'start' : n === xLabels.length - 1 ? 'end' : 'middle'}
            >
              {label(points[i].day)}
            </text>
          ))}
          <path d={area} fill="url(#dailyFill)" />
          <path d={line} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {hp && (
            <g>
              <line x1={hp.x} x2={hp.x} y1={PAD.top} y2={H - PAD.bottom} stroke="#d4d4d8" strokeDasharray="3 3" />
              <circle cx={hp.x} cy={hp.y} r="5" fill={LINE} stroke="#fff" strokeWidth="2" />
            </g>
          )}
          {/* Invisible hit area larger than the line */}
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} fill="transparent" />
        </svg>
        {hp && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[12px] text-white shadow-lg"
            style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%`, marginTop: -10 }}
          >
            <span className="font-semibold tabular-nums">{hp.count}</span> redeemed
            <span className="ml-1.5 text-white/60">{label(hp.day)}</span>
          </div>
        )}
      </div>
      <details className="mt-2 text-[13px] text-zinc-500">
        <summary className="inline-flex cursor-pointer items-center gap-1 hover:text-zinc-800">View as table</summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-100">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-1.5 font-medium">Day</th>
                <th className="px-3 py-1.5 text-right font-medium">Redeemed</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day} className="border-t border-zinc-100">
                  <td className="px-3 py-1.5">{label(d.day)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-800">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <span className="sr-only">Scale maximum {max}</span>
    </div>
  );
}
