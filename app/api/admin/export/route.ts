import { toCsv } from '@/lib/csv';
import { adminGuard, baseUrl } from '@/lib/http';
import { MERGE_TAG } from '@/lib/mailchimp';
import { redeemUrl } from '@/lib/qr';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * ?type=all       full code list with status and gift card order
 * ?type=print     postcard mail-merge file for the print shop (address, code, QR link)
 * ?type=mailchimp email + GIFTCODE, ready for a Mailchimp contact import
 */
export async function GET(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const type = new URL(req.url).searchParams.get('type') ?? 'all';
  const base = baseUrl(req);
  const rows = (await getStore().all()).filter((r) => type === 'all' || r.status !== 'void');

  let table: (string | null)[][];
  if (type === 'print') {
    table = [
      ['name', 'address1', 'city', 'state', 'zip', 'code', 'redeem_url', 'qr_png_url'],
      ...rows.map((r) => [
        r.name,
        r.address1,
        r.city,
        r.state,
        r.zip,
        r.code,
        redeemUrl(base, r.code, 'qr'),
        `${base}/api/qr/${encodeURIComponent(r.code)}?format=png`,
      ]),
    ];
  } else if (type === 'mailchimp') {
    table = [['Email Address', 'Name', MERGE_TAG], ...rows.filter((r) => r.email).map((r) => [r.email, r.name, r.code])];
  } else {
    table = [
      ['code', 'name', 'email', 'city', 'status', 'channel', 'claimed_at', 'gift_status', 'order_id', 'redeem_url'],
      ...rows.map((r) => [
        r.code,
        r.name,
        r.email,
        r.city,
        r.status,
        r.source,
        r.claimed_at,
        r.gift_status,
        r.order_id,
        redeemUrl(base, r.code, 'email'),
      ]),
    ];
  }

  const date = new Date().toISOString().slice(0, 10);
  const name = type === 'print' ? 'postcard-print-file' : type === 'mailchimp' ? 'mailchimp-import' : 'gift-codes';
  // BOM so Excel opens it as UTF-8.
  return new Response(`﻿${toCsv(table)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
