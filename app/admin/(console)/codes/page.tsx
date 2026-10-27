import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import { ActionButton } from '@/components/admin/actions';
import CodesToolbar from '@/components/admin/codes-toolbar';
import RowActions from '@/components/admin/row-actions';
import { btn, Card, ChannelBadge, PageHeader, StatusBadge } from '@/components/admin/ui';
import { config } from '@/lib/config';
import { dateTime, num } from '@/lib/format';
import { originFromHeaders } from '@/lib/http';
import { getStore } from '@/lib/store';
import type { CodeStatus } from '@/lib/store/types';
import { loadSettings, syncDemo } from '@/lib/demo-state';

export const metadata: Metadata = { title: 'Codes' };

const PAGE_SIZE = 25;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CodesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 100) : '';
  const s = sp.status;
  const status: 'all' | CodeStatus = s === 'used' || s === 'unused' || s === 'pending' || s === 'void' ? s : 'all';
  const page = Math.max(1, Math.min(10_000, Number(sp.page) || 1));

  const store = getStore();
  await syncDemo(store);
  const [{ rows, total }, stats] = await Promise.all([store.list({ q, status, page, pageSize: PAGE_SIZE }), store.stats()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const origin = originFromHeaders(await headers());

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (status !== 'all') next.set('status', status);
    next.set('page', String(p));
    return `/admin/codes?${next}`;
  };

  return (
    <>
      <PageHeader
        title="Codes"
        description={`Every client's personal code. Format ${config.codePrefix}-XXXX-XXXX, about 1 trillion combinations.`}
        actions={
          <>
            <a href="/api/admin/export" className={btn.secondary}>
              <Download className="size-4" /> Export CSV
            </a>
            <ActionButton
              endpoint="/api/admin/generate"
              body={{ count: 10 }}
              className={btn.primary}
              success="{added} spare codes added"
            >
              <Plus className="size-4" /> 10 spare codes
            </ActionButton>
          </>
        }
      />

      <Card>
        <Suspense>
          <CodesToolbar
            counts={{ all: stats.total, unused: stats.unused, used: stats.used, pending: stats.pending, void: stats.void }}
          />
        </Suspense>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-[12px] font-medium uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">City</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 font-medium">Redeemed</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-zinc-50/70">
                  <td className="px-5 py-3 font-mono text-[13px] font-medium text-zinc-900">{r.code}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-zinc-900">{r.name || <span className="text-zinc-400">Spare code</span>}</p>
                    <p className="text-[12px] text-zinc-500">{r.email || (r.name ? 'Postcard only' : '')}</p>
                  </td>
                  <td className="px-3 py-3 text-zinc-600">{r.city || '—'}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-3">
                    <ChannelBadge channel={r.source} />
                  </td>
                  <td className="px-3 py-3 tabular-nums text-zinc-600">{dateTime(r.claimed_at, config.timezone)}</td>
                  <td className="px-5 py-3">
                    <RowActions id={r.id} code={r.code} status={r.status} origin={origin} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-500">
                    No codes match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-[13px] text-zinc-500">
          <span>
            {total ? `${num((page - 1) * PAGE_SIZE + 1)}–${num(Math.min(page * PAGE_SIZE, total))}` : '0'} of {num(total)}
          </span>
          <div className="flex gap-1">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className={btn.ghost} scroll={false}>
                <ChevronLeft className="size-4" /> Prev
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={pageHref(page + 1)} className={btn.ghost} scroll={false}>
                Next <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
    </>
  );
}
