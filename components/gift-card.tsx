import { Coffee } from 'lucide-react';

/**
 * Our own eGift card artwork. Deliberately generic: no coffee-chain logos, just the
 * brand name in text so the guest knows where it's redeemable.
 */
export function GiftCardVisual({
  amount,
  brand,
  from,
  state = 'ready',
  className = '',
}: {
  amount: number;
  brand: string;
  from: string;
  state?: 'ready' | 'preparing';
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-pine-600 via-pine-800 to-pine-950 p-6 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/15 sm:p-7 ${className}`}
    >
      {/* soft light + pattern */}
      <div className="absolute -right-16 -top-20 size-64 rounded-full bg-gold-300/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 size-56 rounded-full bg-pine-300/20 blur-3xl" />
      <svg className="absolute inset-0 size-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#fff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-200/90">Holiday eGift</p>
            <p className="mt-1 font-display text-2xl leading-none sm:text-[28px]">{brand}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Coffee className="size-5 text-gold-200" strokeWidth={1.6} />
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">With thanks from</p>
            <p className="truncate text-sm font-medium text-white/90">{from}</p>
          </div>
          <p className="font-display text-5xl leading-none tracking-tight sm:text-6xl">
            {state === 'preparing' ? <span className="text-3xl text-white/70">Preparing…</span> : `$${amount}`}
          </p>
        </div>
      </div>
    </div>
  );
}
