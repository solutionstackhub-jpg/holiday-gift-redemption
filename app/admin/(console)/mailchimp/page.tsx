import { CheckCircle2, CloudDownload, Download, Info, Mail, Send, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Image from 'next/image';
import { ActionButton, CopyButton } from '@/components/admin/actions';
import { btn, Card, CardHeader, PageHeader } from '@/components/admin/ui';
import { config } from '@/lib/config';
import { num } from '@/lib/format';
import { originFromHeaders } from '@/lib/http';
import { photos } from '@/lib/images';
import { audienceInfo, MERGE_TAG, REDEEMED_TAG } from '@/lib/mailchimp';
import { formatEndDate } from '@/lib/settings';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Mailchimp' };

export default async function MailchimpPage() {
  const store = getStore();
  const [stats, settings] = await Promise.all([store.stats(), store.getSettings()]);
  const origin = originFromHeaders(await headers());
  let audience: Awaited<ReturnType<typeof audienceInfo>> | null = null;
  let audienceError = '';
  try {
    audience = await audienceInfo(stats.withEmail);
  } catch (e) {
    audienceError = e instanceof Error ? e.message : 'Could not reach Mailchimp';
  }

  const link = `${origin}/?code=*|${MERGE_TAG}|*&src=email`;
  const unsynced = stats.withEmail - stats.synced;
  const sampleCode = `${config.codePrefix}-8K42-P9QR`;

  return (
    <>
      <PageHeader
        title="Mailchimp"
        description="Put each client's code into your holiday email, with a one-tap button to redeem."
        actions={
          <a href="/api/admin/export?type=mailchimp" className={btn.secondary}>
            <Download className="size-4" /> Mailchimp CSV
          </a>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/10">
              <Mail className="size-5" />
            </span>
            <div>
              <p className="flex items-center gap-2 font-semibold text-zinc-900">
                {audience?.name ?? 'Audience unavailable'}
                {audience && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      audience.mode === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {audience.mode === 'live' ? 'Connected' : 'Demo mode'}
                  </span>
                )}
              </p>
              <p className="text-sm text-zinc-500">
                {audience
                  ? `${num(audience.members)} contacts · codes written to the ${MERGE_TAG} field`
                  : audienceError}
              </p>
            </div>
          </div>
          {audience?.mode === 'demo' && (
            <p className="flex max-w-sm items-start gap-2 text-[13px] text-zinc-500">
              <Info className="mt-0.5 size-4 shrink-0" />
              Add MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID to connect your real audience. Buttons below simulate it.
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="1. Import contacts" description="Every subscribed contact gets a personal code. Existing clients are skipped." />
            <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
              <ActionButton
                endpoint="/api/admin/mailchimp/import"
                className={btn.primary}
                success="{added} new clients · {skipped} already had codes"
              >
                <CloudDownload className="size-4" /> Import from Mailchimp
              </ActionButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Push codes to Mailchimp" description={`Writes each client's code into the ${MERGE_TAG} audience field.`} />
            <div className="p-5 sm:p-6">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-zinc-500">Clients with their code in Mailchimp</span>
                <span className="font-semibold tabular-nums text-zinc-900">
                  {num(stats.synced)} / {num(stats.withEmail)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-pine-600" style={{ width: `${stats.withEmail ? (stats.synced / stats.withEmail) * 100 : 0}%` }} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {unsynced > 0 ? (
                  <ActionButton
                    endpoint="/api/admin/mailchimp/sync"
                    className={btn.primary}
                    success="{pushed} codes sent to Mailchimp"
                  >
                    <Send className="size-4" /> Push {num(unsynced)} new codes
                  </ActionButton>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" /> Everyone is up to date
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Add the button to your email" description="Paste this as the button link in your Mailchimp campaign." />
            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-zinc-400">Button link</p>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1">
                  <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-zinc-800">{link}</code>
                  <CopyButton value={link} />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-zinc-400">Code in the email text</p>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1">
                  <code className="flex-1 font-mono text-[13px] text-zinc-800">*|{MERGE_TAG}|*</code>
                  <CopyButton value={`*|${MERGE_TAG}|*`} />
                </div>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-pine-50/70 p-3.5 text-[13px] leading-relaxed text-pine-900">
                <Tag className="mt-0.5 size-4 shrink-0" />
                When a client redeems, they&rsquo;re tagged &ldquo;{REDEEMED_TAG}&rdquo; in Mailchimp. Send your reminder email
                to everyone without that tag.
              </p>
            </div>
          </Card>
        </div>

        {/* Email preview */}
        <Card className="h-fit overflow-hidden bg-zinc-100/60">
          <CardHeader title="Email preview" description="What clients see in their inbox" />
          <div className="p-5 sm:p-7">
            <div className="mx-auto max-w-[380px] overflow-hidden rounded-[22px] bg-white shadow-xl ring-1 ring-zinc-200">
              <div className="relative h-44">
                <Image src={photos.heroGift.src} alt="" fill placeholder="blur" sizes="380px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 to-transparent" />
                <p className="absolute bottom-4 left-5 right-5 font-display text-[28px] leading-tight text-white">
                  {settings.headline}
                </p>
              </div>
              <div className="space-y-4 p-6 text-[14px] leading-relaxed text-zinc-700">
                <p>Hi Linda,</p>
                <p>
                  Thank you for trusting {settings.firmName} this year. Here&rsquo;s a ${settings.amount} {settings.rewardBrand}{' '}
                  eGift to warm up your holidays.
                </p>
                <div className="rounded-xl border border-dashed border-pine-300 bg-pine-50/60 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-pine-700/70">Your code</p>
                  <p className="mt-1 font-mono text-lg font-semibold tracking-[0.12em] text-pine-900">{sampleCode}</p>
                </div>
                <span className="block rounded-xl bg-berry-500 py-3 text-center font-semibold text-white">Unlock my gift</span>
                <p className="text-[12px] text-zinc-400">Redeem by {formatEndDate(settings)}. One code per client.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
