import { cookies } from 'next/headers';
import { config } from './config';
import { mergeSettings, type CampaignSettings } from './settings';
import type { Channel, Store } from './store/types';

// On serverless hosting (Vercel) each route can run in its own instance with its own memory,
// so in-memory demo data can't be shared between "redeem" and "admin". In demo mode we keep
// this browser's actions in cookies and replay them on whichever instance answers. With
// Supabase configured none of this runs: the database is the single source of truth.

export const CLAIMS_COOKIE = 'hr_gifts';
const SETTINGS_COOKIE = 'hr_demo_settings';
const YEAR = 60 * 60 * 24 * 365;

export interface CookieClaim {
  id: string;
  at: number;
  src: Channel;
}

function cookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: YEAR };
}

export function demoCookiesOn(store: Store) {
  return config.demoMode && store.mode === 'memory';
}

/** Gifts unlocked in this browser: "id~timestamp~source" entries. */
export async function readClaims(): Promise<CookieClaim[]> {
  const raw = (await cookies()).get(CLAIMS_COOKIE)?.value ?? '';
  return raw
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [id, at, src] = entry.split('~');
      return { id, at: Number(at) || Date.now(), src: src === 'email' || src === 'qr' ? src : 'web' } as CookieClaim;
    });
}

export async function rememberClaim(claim: CookieClaim) {
  const list = (await readClaims()).filter((c) => c.id !== claim.id).slice(-11);
  list.push(claim);
  (await cookies()).set(CLAIMS_COOKIE, list.map((c) => `${c.id}~${c.at}~${c.src}`).join(','), cookieOptions());
}

/** Replays this browser's demo redemptions into the current instance. No-op with a real database. */
export async function syncDemo(store: Store) {
  if (!demoCookiesOn(store) || !store.applyDemoClaim) return;
  for (const claim of await readClaims()) await store.applyDemoClaim(claim);
}

/** Campaign settings, including this browser's demo edits when running on in-memory data. */
export async function loadSettings(store: Store): Promise<CampaignSettings> {
  const base = await store.getSettings();
  if (!demoCookiesOn(store)) return base;
  const raw = (await cookies()).get(SETTINGS_COOKIE)?.value;
  if (!raw) return base;
  try {
    return mergeSettings(base, JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return base;
  }
}

export async function saveSettings(store: Store, settings: CampaignSettings) {
  await store.saveSettings(settings);
  if (demoCookiesOn(store)) (await cookies()).set(SETTINGS_COOKIE, JSON.stringify(settings), cookieOptions());
}

export async function clearDemoCookies() {
  const jar = await cookies();
  jar.delete(CLAIMS_COOKIE);
  jar.delete(SETTINGS_COOKIE);
}
