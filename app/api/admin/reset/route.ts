import { config } from '@/lib/config';
import { adminGuard, json } from '@/lib/http';
import { getStore } from '@/lib/store';
import { resetMemoryStore } from '@/lib/store/memory';

/** Demo only: restores the 4,000 sample records and default settings. */
export async function POST() {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!config.demoMode || getStore().mode !== 'memory') {
    return json({ ok: false, error: 'Reset is only available for in-memory demo data.' }, 400);
  }
  resetMemoryStore();
  return json({ ok: true });
}
