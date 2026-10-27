'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { GiftCardVisual } from '@/components/gift-card';
import type { CampaignSettings } from '@/lib/settings';

const input =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-pine-500 focus:ring-4 focus:ring-pine-500/10';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-zinc-800">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[12px] text-zinc-500">{hint}</span>}
    </label>
  );
}

export default function SettingsForm({ initial }: { initial: CampaignSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof CampaignSettings>(k: K, v: CampaignSettings[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save');
      setS(data.settings);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Accept redemptions</p>
            <p className="text-[13px] text-zinc-500">Turn off to pause the guest page instantly.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={s.active}
            onClick={() => set('active', !s.active)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${s.active ? 'bg-pine-600' : 'bg-zinc-300'}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${s.active ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Firm name">
            <input className={input} value={s.firmName} onChange={(e) => set('firmName', e.target.value)} maxLength={80} />
          </Field>
          <Field label="Support email" hint="Shown to clients who need help.">
            <input className={input} type="email" value={s.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
          </Field>
          <Field label="Gift card brand">
            <input className={input} value={s.rewardBrand} onChange={(e) => set('rewardBrand', e.target.value)} maxLength={40} />
          </Field>
          <Field label="Amount per client (USD)">
            <input className={input} type="number" min={1} max={500} step={1} value={s.amount} onChange={(e) => set('amount', Number(e.target.value))} />
          </Field>
          <Field label="Total budget cap (USD)" hint="Redemptions stop once this is reached.">
            <input className={input} type="number" min={1} step={10} value={s.budgetCap} onChange={(e) => set('budgetCap', Number(e.target.value))} />
          </Field>
          <Field label="Last day to redeem">
            <input className={input} type="date" value={s.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
          </Field>
        </div>

        <Field label="Headline on the guest page">
          <input className={input} value={s.headline} onChange={(e) => set('headline', e.target.value)} maxLength={90} />
        </Field>
        <Field label="Thank-you message" hint="Appears on the guest page, the gift reveal and the postcard.">
          <textarea className={`${input} min-h-28 resize-y leading-relaxed`} value={s.message} onChange={(e) => set('message', e.target.value)} maxLength={400} />
        </Field>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-pine-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-pine-800 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" /> Saved. The guest page is updated.
            </span>
          )}
          {error && <span className="text-sm text-rose-700">{error}</span>}
        </div>
      </div>

      <div className="h-fit space-y-4 rounded-2xl bg-pine-950 p-6 text-white">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-300">Live preview</p>
        <p className="font-display text-3xl leading-tight">{s.headline || 'Your headline'}</p>
        <GiftCardVisual amount={s.amount || 0} brand={s.rewardBrand || 'Brand'} from={s.firmName || 'Your firm'} />
        <p className="font-display text-lg italic leading-relaxed text-white/75">&ldquo;{s.message}&rdquo;</p>
      </div>
    </form>
  );
}
