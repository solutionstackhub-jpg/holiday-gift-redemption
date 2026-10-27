'use client';

import { Gift, LayoutDashboard, Sparkles, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Floating helper shown only in demo mode, so a reviewer can try every flow quickly. */
export default function DemoBar({ onTestCode }: { onTestCode?: (code: string) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function tryCode() {
    setBusy(true);
    try {
      const res = await fetch('/api/demo/test-code', { cache: 'no-store' });
      const data = (await res.json()) as { code?: string | null };
      if (!data.code) return;
      if (onTestCode) onTestCode(data.code);
      else router.push(`/?code=${encodeURIComponent(data.code)}#redeem`);
    } finally {
      setBusy(false);
    }
  }

  const item =
    'flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white';

  return (
    <nav
      aria-label="Demo shortcuts"
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/10 bg-pine-950/85 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl"
    >
      <span className="ml-1 mr-1 rounded-full bg-gold-400 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-pine-950">
        Demo
      </span>
      <Link href="/" className={item}>
        <Gift className="size-3.5" />
        <span className="hidden sm:inline">Guest page</span>
      </Link>
      <button type="button" onClick={tryCode} disabled={busy} className={`${item} disabled:opacity-50`}>
        <Ticket className="size-3.5" />
        <span>Try a code</span>
      </button>
      <Link href="/?preview=success" className={item}>
        <Sparkles className="size-3.5" />
        <span className="hidden sm:inline">Gift reveal</span>
      </Link>
      <Link href="/admin" className={item}>
        <LayoutDashboard className="size-3.5" />
        <span className="hidden sm:inline">Admin</span>
      </Link>
    </nav>
  );
}
