'use client';

import { FlaskConical, Gift, LayoutDashboard, Sparkles, Ticket, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Demo-mode shortcuts. Collapsed to a small button in the corner so it never covers
 * page content; the menu opens upward on click.
 */
export default function DemoBar({ onTestCode }: { onTestCode?: (code: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function tryCode() {
    setBusy(true);
    try {
      const res = await fetch('/api/demo/test-code', { cache: 'no-store' });
      const data = (await res.json()) as { code?: string | null };
      if (!data.code) return;
      setOpen(false);
      if (onTestCode) onTestCode(data.code);
      else router.push(`/?code=${encodeURIComponent(data.code)}#redeem`);
    } finally {
      setBusy(false);
    }
  }

  const item =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white';

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {open && (
        <nav
          aria-label="Demo shortcuts"
          className="w-60 animate-rise rounded-2xl border border-white/10 bg-pine-950/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">Demo shortcuts</p>
          <button type="button" onClick={tryCode} disabled={busy} className={`${item} disabled:opacity-50`}>
            <Ticket className="size-4 text-gold-300" /> Try a test code
          </button>
          <Link href="/?preview=success" onClick={() => setOpen(false)} className={item}>
            <Sparkles className="size-4 text-gold-300" /> See the gift reveal
          </Link>
          <Link href="/" onClick={() => setOpen(false)} className={item}>
            <Gift className="size-4 text-gold-300" /> Guest page
          </Link>
          <Link href="/admin" onClick={() => setOpen(false)} className={item}>
            <LayoutDashboard className="size-4 text-gold-300" /> Admin dashboard
          </Link>
        </nav>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close demo shortcuts' : 'Open demo shortcuts'}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-pine-950/90 py-2 pl-2.5 pr-3.5 text-[12.5px] font-semibold text-white shadow-xl shadow-black/25 backdrop-blur-xl transition hover:bg-pine-900"
      >
        <span className="grid size-6 place-items-center rounded-full bg-gold-400 text-pine-950">
          {open ? <X className="size-3.5" strokeWidth={2.5} /> : <FlaskConical className="size-3.5" strokeWidth={2.5} />}
        </span>
        Demo
      </button>
    </div>
  );
}
