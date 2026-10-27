import { checkPassword, setAdminCookie } from '@/lib/auth';
import { clientIp, json, minutesAgoIso } from '@/lib/http';
import { getStore } from '@/lib/store';

export async function POST(req: Request) {
  const store = getStore();
  const key = `admin:${clientIp(req)}`;
  if ((await store.countFailures(key, minutesAgoIso(15))) >= 10) return json({ ok: false }, 429);

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  if (!checkPassword(typeof body?.password === 'string' ? body.password : '')) {
    await store.recordFailure(key);
    return json({ ok: false }, 401);
  }
  await setAdminCookie();
  return json({ ok: true });
}
