'use client';

import {
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Printer,
  Settings,
  Ticket,
  Upload,
} from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Monogram } from '@/components/brand';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/codes', label: 'Codes', icon: Ticket },
  { href: '/admin/import', label: 'Import clients', icon: Upload },
  { href: '/admin/mailchimp', label: 'Mailchimp', icon: Mail },
  { href: '/admin/postcards', label: 'Postcards', icon: Printer },
  { href: '/admin/gift-cards', label: 'Gift cards', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  firmName,
  active,
  daysLeft,
  passwordProtected,
  banner,
}: {
  firmName: string;
  active: boolean;
  daysLeft: number;
  passwordProtected: boolean;
  banner: StaticImageData;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-zinc-200/80 bg-white lg:flex">
        <div className="flex items-center gap-3 px-5 pb-6 pt-6">
          <Monogram name={firmName} tone="dark" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{firmName}</p>
            <p className="text-[12px] text-zinc-500">Holiday Gift admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                isActive(href) ? 'bg-pine-50 text-pine-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className={`size-[18px] ${isActive(href) ? 'text-pine-700' : 'text-zinc-400'}`} strokeWidth={1.9} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <div className="relative isolate overflow-hidden rounded-2xl p-4 text-white">
            <Image src={banner} alt="" fill placeholder="blur" sizes="236px" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950/95 to-pine-950/40" />
            <p className="flex items-center gap-1.5 text-[12px] font-medium">
              <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {active ? 'Campaign live' : 'Campaign paused'}
            </p>
            <p className="mt-1 font-display text-2xl leading-tight">Holiday 2026</p>
            <p className="text-[12px] text-white/70">{daysLeft} days left to redeem</p>
            <Link
              href="/"
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[12px] font-medium backdrop-blur transition hover:bg-white/25"
            >
              Open guest page <ExternalLink className="size-3" />
            </Link>
          </div>
          {passwordProtected && (
            <button
              type="button"
              onClick={logout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <LogOut className="size-[18px]" /> Log out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Monogram name={firmName} tone="dark" size="sm" />
            <p className="text-sm font-semibold text-zinc-900">Holiday Gift admin</p>
          </div>
          {passwordProtected && (
            <button type="button" onClick={logout} className="text-zinc-500" aria-label="Log out">
              <LogOut className="size-5" />
            </button>
          )}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                isActive(href) ? 'bg-pine-50 text-pine-900' : 'text-zinc-600'
              }`}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
