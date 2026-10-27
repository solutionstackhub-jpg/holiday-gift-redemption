'use client';

import { Check, Copy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

function fill(template: string, data: Record<string, unknown>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = data[key];
    return typeof v === 'number' ? v.toLocaleString('en-US') : String(v ?? '');
  });
}

/**
 * Button that POSTs JSON to an admin endpoint, then refreshes the server-rendered page.
 * `success` is the message shown afterwards; {key} is replaced with that field of the JSON reply.
 */
export function ActionButton({
  endpoint,
  body,
  children,
  className,
  confirm,
  success,
}: {
  endpoint: string;
  body?: unknown;
  children: ReactNode;
  className: string;
  confirm?: string;
  success?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const ok = res.ok && data.ok !== false;
      setNote({ ok, text: ok ? fill(success ?? 'Done', data) : String(data.error ?? 'Something went wrong') });
      router.refresh();
    } catch {
      setNote({ ok: false, text: 'Could not reach the server' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" onClick={run} disabled={busy} className={className}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
      {note && (
        <span role="status" className={`text-[13px] ${note.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
          {note.text}
        </span>
      )}
    </span>
  );
}

export function CopyButton({ value, label = 'Copy', className = '' }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 ${className}`}
    >
      {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {done ? 'Copied' : label}
    </button>
  );
}
