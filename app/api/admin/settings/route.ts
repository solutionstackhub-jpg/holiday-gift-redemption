import { loadSettings, saveSettings } from '@/lib/demo-state';
import { adminGuard, json } from '@/lib/http';
import { mergeSettings } from '@/lib/settings';
import { getStore } from '@/lib/store';

export async function PATCH(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const patch = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!patch || typeof patch !== 'object') return json({ ok: false, error: 'Bad request' }, 400);
  const store = getStore();
  const next = mergeSettings(await loadSettings(store), patch);
  await saveSettings(store, next);
  return json({ ok: true, settings: next });
}
