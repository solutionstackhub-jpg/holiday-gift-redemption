import { Info, Store, Smartphone } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BrandMark } from '@/components/brand';
import { GiftCardVisual } from '@/components/gift-card';
import { UUID } from '@/lib/http';
import { photos } from '@/lib/images';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Your eGift' };

/** Fake barcode from the code id, so every demo card looks different. */
function Barcode({ seed }: { seed: string }) {
  const bars = Array.from(seed.replace(/-/g, '').padEnd(32, '7')).flatMap((ch) => {
    const n = parseInt(ch, 16) || 3;
    return [1 + (n % 3), 1 + ((n >> 2) % 2)];
  });
  let x = 0;
  return (
    <svg viewBox="0 0 200 56" className="h-16 w-full" aria-hidden="true">
      {bars.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w * 1.4} height="56" fill="#0b1c16" /> : null;
        x += w * 1.4 + 0.6;
        return rect;
      })}
    </svg>
  );
}

/**
 * Demo stand-in for the provider's eGift page. In production the "Open my eGift" button
 * goes to the real Starbucks eGift hosted by the gift card provider instead.
 */
export default async function DemoGiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const settings = await store.getSettings();
  const row = UUID.test(id) ? await store.findById(id) : null;
  if (!row && id !== 'demo-preview') notFound();
  if (row && row.status !== 'used') notFound();

  const cardNumber = (row?.id ?? '6f1c2a90-0000-4000-8000-1f2e3d4c5b6a').replace(/\D/g, '').padEnd(16, '4').slice(0, 16);

  return (
    <div className="relative isolate min-h-[100svh] overflow-hidden bg-pine-950">
      <Image src={photos.coffeeShop.src} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-pine-950/75 backdrop-blur-[2px]" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <BrandMark name={settings.firmName} />
        <span className="rounded-full bg-gold-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pine-950">
          Demo eGift
        </span>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-20 pt-6 lg:grid-cols-2">
        <div className="text-white">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-gold-300">Your holiday eGift</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">
            ${settings.amount} to spend at {settings.rewardBrand}.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
            {row?.name ? `For ${row.name}. ` : ''}Show the barcode at the register, or add the card to the{' '}
            {settings.rewardBrand} app.
          </p>
          <div className="mt-8 grid max-w-md gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
              <Store className="size-5 text-gold-300" />
              <span className="text-sm">Pay in store</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
              <Smartphone className="size-5 text-gold-300" />
              <span className="text-sm">Add to the app</span>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-3 shadow-2xl">
          <GiftCardVisual amount={settings.amount} brand={settings.rewardBrand} from={settings.firmName} />
          <div className="px-4 pb-4 pt-6">
            <Barcode seed={row?.id ?? 'demo-preview-0f3a9c'} />
            <div className="mt-4 flex items-center justify-between font-mono text-sm text-pine-900">
              <span>{cardNumber.replace(/(.{4})/g, '$1 ').trim()}</span>
              <span className="text-pine-900/50">PIN ••••</span>
            </div>
          </div>
        </div>
      </main>

      <div className="mx-auto max-w-5xl px-5 pb-12">
        <p className="flex items-start gap-2.5 rounded-2xl bg-white/[0.07] p-4 text-sm leading-relaxed text-white/70 ring-1 ring-white/10">
          <Info className="mt-0.5 size-4 shrink-0 text-gold-300" />
          This is a demonstration card and has no value. In the live version this page is the real {settings.rewardBrand}{' '}
          eGift, issued by the gift card provider at the moment the code is redeemed.
        </p>
      </div>
    </div>
  );
}
