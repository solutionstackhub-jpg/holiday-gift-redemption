import { initials } from '@/lib/format';

/** Firm monogram: initials in a ringed circle, so any firm name looks branded. */
export function Monogram({ name, tone = 'light', size = 'md' }: { name: string; tone?: 'light' | 'dark'; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'size-8 text-[13px]' : 'size-10 text-[15px]';
  const colors =
    tone === 'light'
      ? 'bg-white/10 text-white ring-white/30 backdrop-blur'
      : 'bg-pine-900 text-gold-200 ring-gold-400/40';
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-display tracking-wide ring-1 ${dims} ${colors}`}
    >
      {initials(name.replace(/\b(law|firm|group|llc|pllc|pa|the|&|and|of)\b/gi, ' ')) || initials(name)}
    </span>
  );
}

export function BrandMark({ name, tone = 'light' }: { name: string; tone?: 'light' | 'dark' }) {
  return (
    <span className="flex items-center gap-3">
      <Monogram name={name} tone={tone} />
      <span className={`text-[15px] font-semibold tracking-tight ${tone === 'light' ? 'text-white' : 'text-pine-950'}`}>
        {name}
      </span>
    </span>
  );
}
