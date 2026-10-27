import { config } from '@/lib/config';
import { json } from '@/lib/http';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Demo only: hands out an unused code so the client can try the flow. */
export async function GET() {
  if (!config.demoMode) return json({ error: 'Not found' }, 404);
  return json({ code: await getStore().sampleUnused() });
}
