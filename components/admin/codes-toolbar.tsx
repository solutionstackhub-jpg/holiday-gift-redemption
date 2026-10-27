'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unused', label: 'Unused' },
  { id: 'used', label: 'Redeemed' },
  { id: 'pending', label: 'Pending' },
  { id: 'void', label: 'Cancelled' },
] as const;

/** Search box and status tabs. Both live in the URL, so filtered views can be bookmarked. */
export default function CodesToolbar({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [pending, startTransition] = useTransition();
  const status = params.get('status') ?? 'all';

  function go(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete('page');
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    if (q === (params.get('q') ?? '')) return;
    const t = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-100/80 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => go({ status: t.id === 'all' ? '' : t.id })}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
              status === t.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.label}
            <span className="tabular-nums text-zinc-400">{(counts[t.id] ?? 0).toLocaleString('en-US')}</span>
          </button>
        ))}
      </div>
      <label className="relative block sm:w-72">
        <span className="sr-only">Search codes</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, name, email, city"
          className={`w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-pine-500 focus:ring-4 focus:ring-pine-500/10 ${
            pending ? 'opacity-70' : ''
          }`}
        />
      </label>
    </div>
  );
}
