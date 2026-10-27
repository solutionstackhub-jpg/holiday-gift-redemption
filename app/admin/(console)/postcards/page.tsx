import { Download, FileSpreadsheet, QrCode, ScanLine, Type } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Monogram } from '@/components/brand';
import { btn, Card, CardHeader, PageHeader } from '@/components/admin/ui';
import { num } from '@/lib/format';
import { originFromHeaders } from '@/lib/http';
import { photos } from '@/lib/images';
import { qrSvg, redeemUrl } from '@/lib/qr';
import { formatEndDate } from '@/lib/settings';
import { getStore } from '@/lib/store';
import { loadSettings, syncDemo } from '@/lib/demo-state';

export const metadata: Metadata = { title: 'Postcards' };

export default async function PostcardsPage() {
  const store = getStore();
  await syncDemo(store);
  const [settings, sample, stats] = await Promise.all([loadSettings(store), store.sampleForPostcard(), store.stats()]);
  const origin = originFromHeaders(await headers());
  const code = sample?.code ?? 'XMAS-8K42-P9QR';
  const svg = await qrSvg(redeemUrl(origin, code, 'qr'));
  const host = origin.replace(/^https?:\/\//, '');
  const printable = stats.total - stats.void;

  return (
    <>
      <PageHeader
        title="Postcards"
        description="A print-ready mail-merge file with every client's address, code and QR link."
        actions={
          <a href="/api/admin/export?type=print" className={btn.primary}>
            <Download className="size-4" /> Print file ({num(printable)})
          </a>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader title="Postcard preview" description={`Using a real code from your list · ${sample?.name ?? 'sample client'}`} />
        <div className="grid gap-6 bg-zinc-100/60 p-5 sm:p-8 xl:grid-cols-2">
          {/* Front */}
          <div className="relative isolate aspect-[3/2] overflow-hidden rounded-xl shadow-xl ring-1 ring-black/5">
            <Image src={photos.heroCoffee.src} alt="" fill placeholder="blur" sizes="(min-width: 1280px) 560px, 100vw" className="-z-20 -scale-x-100 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-950/90 via-pine-950/50 to-transparent" />
            <div className="flex h-full flex-col justify-between p-6 text-white sm:p-8">
              <Monogram name={settings.firmName} />
              <div>
                <p className="font-display text-3xl leading-[1.05] sm:text-[40px]">{settings.headline}</p>
                <p className="mt-2 text-sm text-white/75">
                  A ${settings.amount} {settings.rewardBrand} eGift from {settings.firmName}
                </p>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="grid aspect-[3/2] grid-cols-[1.15fr_1fr] gap-5 rounded-xl bg-[#fffdf8] p-5 text-pine-950 shadow-xl ring-1 ring-black/5 sm:p-7">
            <div className="flex flex-col justify-between border-r border-dashed border-pine-900/15 pr-5">
              <div>
                <p className="font-display text-xl leading-tight sm:text-2xl">Happy holidays!</p>
                <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-pine-900/70 sm:text-[12px]">{settings.message}</p>
              </div>
              <div className="flex items-end gap-3">
                <div className="size-[68px] shrink-0 rounded-md bg-white p-1.5 ring-1 ring-pine-900/10 sm:size-20 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-pine-900/50">Scan or visit {host}</p>
                  <p className="mt-1 font-mono text-[13px] font-semibold tracking-[0.08em] sm:text-[15px]">{code}</p>
                  <p className="text-[9px] text-pine-900/50">Redeem by {formatEndDate(settings)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="ml-auto grid h-14 w-12 place-items-center rounded-sm border-2 border-dashed border-pine-900/20 text-[8px] uppercase tracking-wider text-pine-900/40">
                Stamp
              </div>
              <div className="space-y-1 text-[12px] leading-snug sm:text-[13px]">
                <p className="font-semibold">{sample?.name || 'Client Name'}</p>
                <p>{sample?.address1 || '123 Main St'}</p>
                <p>
                  {sample?.city || 'Greenville'}, {sample?.state || 'SC'} {sample?.zip || '29601'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="What's in the print file" description="Send it to your print shop for variable-data printing." />
          <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {[
              { icon: FileSpreadsheet, title: 'Name and mailing address', text: 'name, address1, city, state, zip' },
              { icon: Type, title: 'The printed code', text: 'code, in a font with no look-alike characters' },
              { icon: ScanLine, title: 'QR link', text: 'redeem_url, opens the page with the code filled in' },
              { icon: QrCode, title: 'Ready-made QR images', text: 'qr_png_url, a 600px PNG per client' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-700">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{title}</p>
                  <p className="font-mono text-[12px] text-zinc-500">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-zinc-100 px-5 py-4 text-[13px] leading-relaxed text-zinc-500 sm:px-6">
            Scans from postcards are tracked separately from email clicks, so you can see on the Overview which channel
            actually brought people in.
          </p>
        </Card>
        <Card className="overflow-hidden">
          <div className="relative h-full min-h-56">
            <Image src={photos.postcard.src} alt={photos.postcard.alt} fill placeholder="blur" sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-pine-950/85 via-pine-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="font-display text-2xl">Print timing</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/75">
                Most print shops need the file 2–3 weeks before mailing. Codes work the moment they&rsquo;re imported.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
