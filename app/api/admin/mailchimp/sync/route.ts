import { adminGuard, json } from '@/lib/http';
import { pushCodes } from '@/lib/mailchimp';
import { getStore } from '@/lib/store';

/** Writes codes into the GIFTCODE field for every contact that doesn't have one yet. */
export async function POST() {
  const denied = await adminGuard();
  if (denied) return denied;

  const store = getStore();
  try {
    let pushed = 0;
    let batches = 0;
    // 500 contacts per Mailchimp batch; 4,000 clients = 8 batches.
    for (let round = 0; round < 40; round++) {
      const rows = await store.unsynced(500);
      if (rows.length === 0) break;
      await pushCodes(rows);
      await store.markSynced(rows.map((r) => r.id));
      pushed += rows.length;
      batches++;
    }
    return json({ ok: true, pushed, batches });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Sync failed' }, 502);
  }
}
