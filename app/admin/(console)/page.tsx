import { ArrowRight, Clock, CreditCard, ExternalLink, Ticket, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import DailyChart from '@/components/admin/daily-chart';
import { Avatar, btn, Card, CardHeader, CHANNEL, ChannelBadge, PageHeader, StatTile } from '@/components/admin/ui';
import { config } from '@/lib/config';
import { dayKey, money, num, timeAgo } from '@/lib/format';
import { photos } from '@/lib/images';
import { daysLeft } from '@/lib/settings';
import { getStore } from '@/lib/store';
import type { Channel } from '@/lib/store/types';

export const metadata: Metadata = { title: 'Overview' };

const DAYS = 30;
const DAY_MS = 86_400_000;

export default async function OverviewPage() {
  const store = getStore();
  const now = Date.now();
  const [settings, stats, daily, recent] = await Promise.all([
    store.getSettings(),
    store.stats(),
    store.daily(new Date(now - DAYS * DAY_MS).toISOString(), config.timezone),
    store.recentIssued(7),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, d.count]));
  const series = Array.from({ length: DAYS }, (_, i) => {
    const day = dayKey(new Date(now - (DAYS - 1 - i) * DAY_MS), config.timezone);
    return { day, count: byDay.get(day) ?? 0 };
  });

  const issued = stats.total - stats.void;
  const claimed = stats.used + stats.pending;
  const rate = issued ? claimed / issued : 0;
  const spent = stats.used * settings.amount;
  const upfront = issued * settings.amount;
  const saved = Math.max(0, upfront - claimed * settings.amount);
  const channelTotal = Object.values(stats.channels).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${settings.firmName} · Holiday 2026 · ${daysLeft(settings)} days left to redeem`}
        actions={
          <>
            <a href="/api/admin/export" className={btn.secondary}>
              Export CSV
            </a>
            <Link href="/" target="_blank" className={btn.primary}>
              Guest page <ExternalLink className="size-4" />
            </Link>
          </>
        }
      />

      {/* Hero banner: the business result in one line */}
      <Card className="relative isolate mb-6 overflow-hidden border-0">
        <Image src={photos.heroGift.src} alt="" fill priority placeholder="blur" sizes="(min-width: 1024px) 980px, 100vw" className="-z-20 object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950 via-pine-950/90 to-pine-950/20" />
        <div className="grid gap-8 p-7 text-white sm:p-9 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-300">Pay only for opened gifts</p>
            <p className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              {money(saved)} <span className="text-white/60">not spent yet</span>
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
              Buying {num(issued)} cards upfront would cost {money(upfront)}. Cards are ordered only when a client redeems,
              so you&rsquo;ve paid {money(spent)} so far.
            </p>
          </div>
          <div className="self-end rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-baseline justify-between text-[13px] text-white/70">
              <span>Budget used</span>
              <span className="tabular-nums">
                {money(spent)} / {money(settings.budgetCap)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gold-300" style={{ width: `${Math.min(100, (spent / settings.budgetCap) * 100)}%` }} />
            </div>
            <p className="mt-3 text-[12px] text-white/60">
              Redemptions stop automatically if the budget is reached.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Ticket} label="Codes issued" value={num(issued)} foot={`${num(stats.unused)} not used yet`} />
        <StatTile icon={TrendingUp} label="Redemption rate" value={`${(rate * 100).toFixed(1)}%`} meter={rate} foot={`${num(claimed)} clients redeemed`} />
        <StatTile icon={CreditCard} label="Gift card spend" value={money(spent)} foot={`${money(settings.amount)} per redeemed code`} />
        <StatTile
          icon={Clock}
          label="Needs attention"
          value={num(stats.pending)}
          foot={
            stats.pending ? (
              <Link href="/admin/gift-cards" className="font-medium text-amber-700 hover:underline">
                Retry stuck gift cards →
              </Link>
            ) : (
              'Every claimed gift was delivered'
            )
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Redemptions per day" description="Last 30 days · hover for daily totals" />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            <DailyChart data={series} />
          </div>
        </Card>

        <Card>
          <CardHeader title="How clients redeemed" description="Postcard vs. email vs. typed" />
          <div className="space-y-5 p-5 sm:p-6">
            {(Object.keys(CHANNEL) as Channel[]).map((ch) => {
              const value = stats.channels[ch];
              const pct = channelTotal ? value / channelTotal : 0;
              const c = CHANNEL[ch];
              return (
                <div key={ch}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium text-zinc-700">
                      <span className="size-2.5 rounded-sm" style={{ background: c.color }} />
                      {c.label}
                    </span>
                    <span className="tabular-nums text-zinc-500">
                      <span className="font-semibold text-zinc-900">{num(value)}</span> · {(pct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100" title={`${c.label}: ${num(value)}`}>
                    <div className="h-full rounded-r-[4px]" style={{ width: `${pct * 100}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
            <p className="border-t border-zinc-100 pt-4 text-[13px] leading-relaxed text-zinc-500">
              Tells you which channel is worth paying for next year: printed postcards or the email.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Latest redemptions"
            action={
              <Link href="/admin/codes?status=used" className={btn.ghost}>
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-zinc-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                <Avatar name={r.name || r.code} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{r.name || 'Unassigned code'}</p>
                  <p className="truncate font-mono text-[12px] text-zinc-500">{r.code}</p>
                </div>
                <div className="hidden sm:block">
                  <ChannelBadge channel={r.source} />
                </div>
                <span className="w-20 text-right text-[13px] text-zinc-500">{timeAgo(r.claimed_at, now)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Mailchimp" description="Codes written to your audience" />
          <div className="p-5 sm:p-6">
            <p className="text-[30px] font-semibold leading-none tracking-tight tabular-nums">
              {num(stats.synced)}
              <span className="text-lg font-medium text-zinc-400"> / {num(stats.withEmail)}</span>
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-pine-600" style={{ width: `${stats.withEmail ? (stats.synced / stats.withEmail) * 100 : 0}%` }} />
            </div>
            <p className="mt-3 text-[13px] text-zinc-500">
              {stats.withEmail - stats.synced > 0
                ? `${num(stats.withEmail - stats.synced)} new clients still need their code in Mailchimp.`
                : 'Every client with an email has their code in Mailchimp.'}
            </p>
            <Link href="/admin/mailchimp" className={`${btn.secondary} mt-5 w-full`}>
              Open Mailchimp tools
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
