import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { config } from './config';

// Demo-grade admin login: one shared password and a signed cookie.
// For production this would move to Supabase Auth (email magic link).
const COOKIE = 'hr_admin';
const MAX_AGE = 60 * 60 * 12;

export function adminPasswordSet() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sessionToken() {
  return createHmac('sha256', process.env.ADMIN_PASSWORD ?? '').update('holiday-rewards-admin-session-v1').digest('hex');
}

function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** With no password set, the admin is open only in demo mode. */
export async function isAdmin() {
  if (!adminPasswordSet()) return config.demoMode;
  const value = (await cookies()).get(COOKIE)?.value;
  return value ? safeEqual(value, sessionToken()) : false;
}

export function checkPassword(input: string) {
  return adminPasswordSet() && safeEqual(input, process.env.ADMIN_PASSWORD as string);
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}
