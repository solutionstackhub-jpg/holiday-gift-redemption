import { randomChars } from './codes';
import type { CampaignSettings } from './settings';
import type { CodeRow } from './store/types';

export type ProviderMode = 'mock' | 'tremendous-sandbox' | 'tremendous-live';

export type IssueResult =
  | { ok: true; orderId: string; link: string | null; delivered: boolean }
  | { ok: false; error: string };

export function providerMode(): ProviderMode {
  if (!process.env.TREMENDOUS_API_KEY) return 'mock';
  return process.env.TREMENDOUS_ENV === 'production' ? 'tremendous-live' : 'tremendous-sandbox';
}

export const PROVIDER_LABEL: Record<ProviderMode, string> = {
  mock: 'Demo provider',
  'tremendous-sandbox': 'Tremendous sandbox',
  'tremendous-live': 'Tremendous',
};

/** Orders one gift card for this code. Called only at the moment a client redeems. */
export async function issueGiftCard(row: CodeRow, settings: CampaignSettings): Promise<IssueResult> {
  return providerMode() === 'mock' ? issueMock(row) : issueTremendous(row, settings);
}

async function issueMock(row: CodeRow): Promise<IssueResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  // The demo reward page stands in for the real eGift page the provider would host.
  return { ok: true, orderId: `DEMO-ORD-${randomChars(8)}`, link: `/gift/${row.id}`, delivered: true };
}

interface TremendousResponse {
  order?: { id?: string; status?: string; rewards?: { delivery?: { link?: string } }[] };
  errors?: { message?: string };
}

async function issueTremendous(row: CodeRow, settings: CampaignSettings): Promise<IssueResult> {
  const productId = process.env.TREMENDOUS_PRODUCT_ID;
  const campaignId = process.env.TREMENDOUS_CAMPAIGN_ID;
  if (!productId && !campaignId) {
    return { ok: false, error: 'Set TREMENDOUS_PRODUCT_ID (Starbucks) or TREMENDOUS_CAMPAIGN_ID.' };
  }
  const base =
    providerMode() === 'tremendous-live' ? 'https://api.tremendous.com/api/v2' : 'https://testflight.tremendous.com/api/v2';

  try {
    const res = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TREMENDOUS_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // LINK delivery: the page shows the gift right away, so postcard-only clients don't need an
      // email on file. external_id = our code id, so a retry returns the same order (no double charge).
      body: JSON.stringify({
        external_id: row.id,
        payment: { funding_source_id: process.env.TREMENDOUS_FUNDING_SOURCE_ID || 'BALANCE' },
        reward: {
          value: { denomination: settings.amount, currency_code: 'USD' },
          recipient: { name: row.name || 'Valued Client', ...(row.email ? { email: row.email } : {}) },
          delivery: { method: 'LINK' },
          ...(campaignId ? { campaign_id: campaignId } : { products: [productId] }),
        },
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => null)) as TremendousResponse | null;
    if (!res.ok) return { ok: false, error: `Tremendous: ${data?.errors?.message ?? `HTTP ${res.status}`}` };
    const order = data?.order;
    if (!order?.id) return { ok: false, error: 'Tremendous returned no order ID.' };
    if (order.status === 'FAILED' || order.status === 'CANCELED') {
      return { ok: false, error: `Tremendous order ${order.status.toLowerCase()}` };
    }
    const link = order.rewards?.[0]?.delivery?.link ?? null;
    return { ok: true, orderId: order.id, link, delivered: order.status === 'EXECUTED' && Boolean(link) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gift card request failed' };
  }
}
