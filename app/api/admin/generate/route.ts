import { generateCode } from '@/lib/codes';
import { config } from '@/lib/config';
import { adminGuard, json } from '@/lib/http';
import { getStore } from '@/lib/store';

/** Spare codes not tied to a client yet (extra postcards, walk-ins). */
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { count?: unknown } | null;
  const count = Math.min(500, Math.max(1, Math.floor(Number(body?.count) || 10)));
  const rows = Array.from({ length: count }, () => ({ code: generateCode(config.codePrefix), name: '', email: '' }));
  const { added } = await getStore().insert(rows);
  return json({ added });
}
