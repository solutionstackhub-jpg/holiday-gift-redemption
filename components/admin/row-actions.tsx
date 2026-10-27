'use client';

import { Ban, Check, Link2, MoreHorizontal, QrCode, RefreshCw, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CodeStatus } from '@/lib/store/types';

/** Per-code menu: copy the personal link, open the QR, cancel/restore, retry a stuck gift. */
export default function RowActions({ id, code, status, origin }: { id: string; code: string; status: CodeStatus; origin: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function post(endpoint: string, body: unknown, done: string) {
    setOpen(false);
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok && data.ok !== false ? done : data.error ?? 'Failed');
    setTimeout(() => setNote(''), 2500);
    router.refresh();
  }

  async function copyLink() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(`${origin}/?code=${encodeURIComponent(code)}&src=email`);
      setNote('Link copied');
    } catch {
      setNote('Copy blocked');
    }
    setTimeout(() => setNote(''), 2000);
  }

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-zinc-700 hover:bg-zinc-100';

  return (
    <div ref={ref} className="relative flex items-center justify-end gap-2">
      {note && (
        <span className="flex items-center gap-1 text-[12px] text-emerald-700">
          <Check className="size-3.5" /> {note}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${code}`}
        aria-expanded={open}
        className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl">
          <button type="button" className={item} onClick={copyLink}>
            <Link2 className="size-4 text-zinc-400" /> Copy personal link
          </button>
          <a className={item} href={`/api/qr/${encodeURIComponent(code)}?format=png`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <QrCode className="size-4 text-zinc-400" /> Open QR code
          </a>
          {status === 'unused' && (
            <button type="button" className={`${item} text-rose-700`} onClick={() => post('/api/admin/void', { id, void: true }, 'Cancelled')}>
              <Ban className="size-4" /> Cancel code
            </button>
          )}
          {status === 'void' && (
            <button type="button" className={item} onClick={() => post('/api/admin/void', { id, void: false }, 'Restored')}>
              <Undo2 className="size-4 text-zinc-400" /> Restore code
            </button>
          )}
          {status === 'pending' && (
            <button type="button" className={item} onClick={() => post('/api/admin/retry', { id }, 'Gift issued')}>
              <RefreshCw className="size-4 text-zinc-400" /> Retry gift card
            </button>
          )}
        </div>
      )}
    </div>
  );
}
