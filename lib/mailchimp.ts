import { createHash } from 'node:crypto';
import type { CodeRow, NewCode } from './store/types';

// Mailchimp Marketing API v3. With no key set, everything runs in demo mode.
export const MERGE_TAG = 'GIFTCODE';
export const REDEEMED_TAG = 'Holiday gift redeemed';

export function mailchimpConfigured() {
  return Boolean(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_AUDIENCE_ID);
}

function audienceId() {
  return process.env.MAILCHIMP_AUDIENCE_ID as string;
}

async function mc<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.MAILCHIMP_API_KEY as string;
  const dc = key.split('-').pop();
  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`holiday-rewards:${key}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Mailchimp: ${data?.detail ?? data?.title ?? `HTTP ${res.status}`}`);
  return data as T;
}

const memberHash = (email: string) => createHash('md5').update(email.toLowerCase()).digest('hex');

export async function audienceInfo(fallbackMembers: number) {
  if (!mailchimpConfigured()) {
    return { mode: 'demo' as const, name: 'Holiday Clients 2026', members: fallbackMembers };
  }
  const list = await mc<{ name: string; stats?: { member_count?: number } }>(`/lists/${audienceId()}`);
  return { mode: 'live' as const, name: list.name, members: list.stats?.member_count ?? 0 };
}

/** Creates the GIFTCODE audience field if it doesn't exist yet. */
async function ensureMergeField() {
  const res = await mc<{ merge_fields: { tag: string }[] }>(`/lists/${audienceId()}/merge-fields?count=100`);
  if (res.merge_fields.some((f) => f.tag === MERGE_TAG)) return;
  await mc(`/lists/${audienceId()}/merge-fields`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Gift Code', tag: MERGE_TAG, type: 'text', public: false }),
  });
}

interface Member {
  email_address: string;
  merge_fields?: Record<string, unknown>;
}

/** Subscribed contacts from the audience, ready to be given codes. */
export async function fetchAudience(demoSample: () => NewCode[]): Promise<Omit<NewCode, 'code'>[]> {
  if (!mailchimpConfigured()) return demoSample();
  const out: Omit<NewCode, 'code'>[] = [];
  for (let offset = 0; offset < 50_000; offset += 1000) {
    const page = await mc<{ members: Member[]; total_items: number }>(
      `/lists/${audienceId()}/members?status=subscribed&count=1000&offset=${offset}` +
        '&fields=members.email_address,members.merge_fields,total_items',
    );
    for (const m of page.members) {
      const f = m.merge_fields ?? {};
      const addr = typeof f.ADDRESS === 'object' && f.ADDRESS ? (f.ADDRESS as Record<string, string>) : {};
      out.push({
        email: m.email_address.toLowerCase(),
        name: [f.FNAME, f.LNAME].filter((x) => typeof x === 'string' && x).join(' '),
        address1: addr.addr1 ?? '',
        city: addr.city ?? '',
        state: addr.state ?? '',
        zip: addr.zip ?? '',
      });
    }
    if (offset + 1000 >= page.total_items) break;
  }
  return out;
}

/**
 * Writes each client's code into their GIFTCODE field using one batch request.
 * Mailchimp processes batches in the background, usually within a few minutes.
 */
export async function pushCodes(rows: CodeRow[]) {
  if (!mailchimpConfigured() || rows.length === 0) return { batchId: null as string | null };
  await ensureMergeField();
  const operations = rows.map((r) => ({
    method: 'PATCH',
    path: `/lists/${audienceId()}/members/${memberHash(r.email)}`,
    body: JSON.stringify({ merge_fields: { [MERGE_TAG]: r.code } }),
    operation_id: r.id,
  }));
  const batch = await mc<{ id: string }>('/batches', { method: 'POST', body: JSON.stringify({ operations }) });
  return { batchId: batch.id };
}

/** Tags a contact after they redeem, so follow-up emails can go only to people who haven't. */
export async function tagRedeemed(email: string) {
  if (!mailchimpConfigured()) return;
  await mc(`/lists/${audienceId()}/members/${memberHash(email)}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags: [{ name: REDEEMED_TAG, status: 'active' }] }),
  });
}
