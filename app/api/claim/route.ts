import { cookies } from 'next/headers';
import { normalizeCode } from '@/lib/codes';
import { config } from '@/lib/config';
import { firstName } from '@/lib/format';
import { clientIp, json, minutesAgoIso } from '@/lib/http';
import { fulfill } from '@/lib/redeem';
import { campaignEnded } from '@/lib/settings';
import { getStore } from '@/lib/store';
import type { Channel, CodeRow } from '@/lib/store/types';

// Remembers which gifts this browser unlocked, so re-entering the code shows the gift again
// on the same device, while anyone else who finds the code only sees "already claimed".
const GIFT_COOKIE = 'hr_gifts';

function success(row: CodeRow, amount: number, brand: string, returning: boolean, status: 'sent' | 'processing' | 'queued') {
  return json({
    ok: true,
    status,
    returning,
    code: row.code,
    name: firstName(row.name),
    amount,
    brand,
    link: row.reward_link,
    claimedAt: row.claimed_at,
  });
}

export async function POST(req: Request) {
  const store = getStore();
  const settings = await store.getSettings();
  if (!settings.active) return json({ ok: false, reason: 'paused' }, 403);
  if (campaignEnded(settings)) return json({ ok: false, reason: 'ended' }, 410);

  const ip = clientIp(req);
  const { maxFailures, windowMinutes } = config.rateLimit;
  if ((await store.countFailures(ip, minutesAgoIso(windowMinutes))) >= maxFailures) {
    return json({ ok: false, reason: 'rate_limited', minutes: windowMinutes }, 429);
  }

  const body = (await req.json().catch(() => null)) as { code?: unknown; src?: unknown } | null;
  const code = normalizeCode(typeof body?.code === 'string' ? body.code : '', config.codePrefix);
  const source: Channel = body?.src === 'email' || body?.src === 'qr' ? body.src : 'web';
  const row = code ? await store.find(code) : null;

  if (!code || !row || row.status === 'void') {
    await store.recordFailure(ip);
    return json({ ok: false, reason: 'invalid' }, 400);
  }

  const jar = await cookies();
  const mine = (jar.get(GIFT_COOKIE)?.value ?? '').split(',').filter(Boolean);

  if (row.status === 'used' || row.status === 'pending') {
    if (mine.includes(row.id)) {
      return success(row, settings.amount, settings.rewardBrand, true, row.status === 'used' && row.reward_link ? 'sent' : 'queued');
    }
    return json({ ok: false, reason: 'already_claimed', claimedAt: row.claimed_at }, 409);
  }

  // Budget guard: never order more cards than the firm agreed to pay for.
  const stats = await store.stats();
  if ((stats.used + stats.pending + 1) * settings.amount > settings.budgetCap) {
    return json({ ok: false, reason: 'budget' }, 403);
  }

  const claimed = await store.claim(code, ip, source);
  if (!claimed) return json({ ok: false, reason: 'already_claimed', claimedAt: new Date().toISOString() }, 409);

  jar.set(GIFT_COOKIE, [...mine.slice(-9), claimed.id].join(','), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  const result = await fulfill(store, claimed, settings);
  const updated = (await store.findById(claimed.id)) ?? claimed;
  const status = result.ok ? (result.link ? 'sent' : 'processing') : 'queued';
  return success(updated, settings.amount, settings.rewardBrand, false, status);
}
