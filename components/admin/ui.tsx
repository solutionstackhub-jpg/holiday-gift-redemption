import { Ban, CircleCheck, CircleDashed, Clock, Keyboard, Mail, QrCode, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Channel, CodeStatus } from '@/lib/store/types';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-pine-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-pine-800 disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50',
};

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  foot,
  meter,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  foot?: ReactNode;
  /** 0–1, drawn as a thin progress bar */
  meter?: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500">
        <Icon className="size-4 text-zinc-400" />
        {label}
      </div>
      <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-zinc-950 tabular-nums">{value}</p>
      {meter !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100" role="presentation">
          <div className="h-full rounded-full bg-pine-600" style={{ width: `${Math.min(100, Math.max(0, meter * 100))}%` }} />
        </div>
      )}
      {foot && <p className="mt-3 text-[13px] text-zinc-500">{foot}</p>}
    </Card>
  );
}

const STATUS: Record<CodeStatus, { label: string; icon: LucideIcon; cls: string }> = {
  used: { label: 'Redeemed', icon: CircleCheck, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  unused: { label: 'Unused', icon: CircleDashed, cls: 'bg-zinc-50 text-zinc-600 ring-zinc-500/15' },
  pending: { label: 'Pending', icon: Clock, cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  void: { label: 'Cancelled', icon: Ban, cls: 'bg-rose-50 text-rose-700 ring-rose-600/15' },
};

export function StatusBadge({ status }: { status: CodeStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${s.cls}`}>
      <s.icon className="size-3" strokeWidth={2.2} />
      {s.label}
    </span>
  );
}

// Categorical chart colors (validated for color-blind separation; see dataviz check).
export const CHANNEL: Record<Channel, { label: string; icon: LucideIcon; color: string }> = {
  email: { label: 'Email link', icon: Mail, color: '#2a78d6' },
  qr: { label: 'Postcard QR', icon: QrCode, color: '#eb6834' },
  web: { label: 'Typed code', icon: Keyboard, color: '#1baf7a' },
};

export function ChannelBadge({ channel }: { channel: Channel | null }) {
  if (!channel) return <span className="text-zinc-300">—</span>;
  const c = CHANNEL[channel];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-600">
      <c.icon className="size-3.5 text-zinc-400" />
      {c.label}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pine-50 text-[12px] font-semibold text-pine-700 ring-1 ring-pine-600/10">
      {letters || '?'}
    </span>
  );
}
