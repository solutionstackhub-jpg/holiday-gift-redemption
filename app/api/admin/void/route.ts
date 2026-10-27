import { adminGuard, json, UUID } from '@/lib/http';
import { getStore } from '@/lib/store';

/** Cancels an unused code (lost postcard, duplicate client) or restores a cancelled one. */
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { id?: unknown; void?: unknown } | null;
  const id = typeof body?.id === 'string' && UUID.test(body.id) ? body.id : '';
  if (!id || typeof body?.void !== 'boolean') return json({ ok: false, error: 'Bad request' }, 400);
  const ok = await getStore().setVoid(id, body.void);
  return ok
    ? json({ ok: true })
    : json({ ok: false, error: body.void ? 'Only unused codes can be cancelled.' : 'This code is not cancelled.' }, 409);
}
