import { adminGuard, json, UUID } from '@/lib/http';
import { fulfill } from '@/lib/redeem';
import { getStore } from '@/lib/store';
import { loadSettings } from '@/lib/demo-state';

/** Re-orders the gift card for a code stuck in "pending". Same external_id, so no double charge. */
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === 'string' && UUID.test(body.id) ? body.id : '';
  const store = getStore();
  const row = id ? await store.findById(id) : null;
  if (!row || row.status !== 'pending') {
    return json({ ok: false, error: 'This code is not waiting for a gift card.' }, 400);
  }
  const result = await fulfill(store, row, await loadSettings(store));
  return result.ok ? json({ ok: true }) : json({ ok: false, error: result.error }, 502);
}
