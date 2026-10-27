import { CheckCircle2, CreditCard, ExternalLink, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ActionButton } from '@/components/admin/actions';
import { Avatar, btn, Card, CardHeader, ChannelBadge, PageHeader, StatTile } from '@/components/admin/ui';
import { config } from '@/lib/config';
import { dateTime, money, num } from '@/lib/format';
import { PROVIDER_LABEL, providerMode } from '@/lib/giftcards';
import { photos } from '@/lib/images';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Gift cards' };

export default async function GiftCardsPage() {
  const store = getStore();
  const [settings, stats, pending, recent] = await Promise.all([
    store.getSettings(),
    store.stats(),
    store.pendingRows(25),
    store.recentIssued(12),
  ]);
  const mode = providerMode();
  const spent = stats.used * settings.amount;

  return (
    <>
      <PageHeader title="Gift cards" description="Each card is ordered from the provider at the moment a client redeems." />

      <Card className="relative isolate mb-6 overflow-hidden border-0">
        <Image src={photos.coffeeShop.src} alt="" fill placeholder="blur" sizes="(min-width: 1024px) 980px, 100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950 via-pine-950/85 to-pine-950/30" />
        <div className="flex flex-col gap-6 p-7 text-white sm:p-9 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-300">
              <ShieldCheck className="size-4" /> {PROVIDER_LABEL[mode]}
              {mode === 'mock' && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] text-pine-950">Demo</span>}
            </p>
            <p className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              ${settings.amount} {settings.rewardBrand} eGift
            </p>
            <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/70">
              {mode === 'mock'
                ? 'Demo mode issues sample cards. Add a Tremendous API key to send real Starbucks eGifts, paid from a balance you top up as you go.'
                : 'Paid from your Tremendous balance. Every order carries the code ID, so a retry can never buy the same card twice.'}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur">
            <p className="text-[12px] text-white/60">Budget left</p>
            <p className="text-2xl font-semibold tabular-nums">{money(Math.max(0, settings.budgetCap - spent))}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={CreditCard} label="Cards issued" value={num(stats.used)} />
        <StatTile icon={Wallet} label="Spent" value={money(spent)} foot={`of ${money(settings.budgetCap)} budget`} meter={spent / settings.budgetCap} />
        <StatTile icon={RefreshCw} label="Waiting for retry" value={num(stats.pending)} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Needs attention"
          description="Codes that were accepted but the provider didn't return a card yet. The client already sees 'on its way'."
        />
        {pending.length === 0 ? (
          <p className="flex items-center gap-2 px-6 py-8 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> Nothing waiting. Every claimed gift was delivered.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <Avatar name={r.name || r.code} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {r.name} <span className="font-mono text-[12px] text-zinc-500">· {r.code}</span>
                  </p>
                  <p className="text-[13px] text-rose-700">{r.gift_error ?? 'Still processing'}</p>
                </div>
                <span className="text-[13px] text-zinc-500">{dateTime(r.claimed_at, config.timezone)}</span>
                <ActionButton endpoint="/api/admin/retry" body={{ id: r.id }} className={btn.secondary} success="Gift card issued">
                  <RefreshCw className="size-4" /> Retry
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Recently issued" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-[12px] uppercase tracking-wide text-zinc-400">
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Redeemed</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3">
                    <p className="font-medium text-zinc-900">{r.name || 'Spare code'}</p>
                    <p className="font-mono text-[12px] text-zinc-500">{r.code}</p>
                  </td>
                  <td className="px-3 py-3">
                    <ChannelBadge channel={r.source} />
                  </td>
                  <td className="px-3 py-3 font-mono text-[12px] text-zinc-600">{r.order_id}</td>
                  <td className="px-3 py-3 text-zinc-600">{dateTime(r.claimed_at, config.timezone)}</td>
                  <td className="px-6 py-3 text-right">
                    {r.reward_link && (
                      <a href={r.reward_link} target="_blank" rel="noreferrer" className={btn.ghost}>
                        View card <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
