import { isAdmin } from './auth';
import { config } from './config';

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Returns a 401 response when the caller is not signed in to the admin. */
export async function adminGuard(): Promise<Response | null> {
  return (await isAdmin()) ? null : json({ error: 'Unauthorized' }, 401);
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

/** Public origin, respecting proxies such as Vercel or a Cloudflare tunnel. */
export function originFromHeaders(h: Headers) {
  if (config.publicBaseUrl) return config.publicBaseUrl;
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function baseUrl(req: Request) {
  return originFromHeaders(req.headers);
}

export function minutesAgoIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
