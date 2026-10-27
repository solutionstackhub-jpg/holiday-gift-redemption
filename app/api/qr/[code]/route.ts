import { normalizeCode } from '@/lib/codes';
import { config } from '@/lib/config';
import { baseUrl } from '@/lib/http';
import { qrPng, qrSvg, redeemUrl } from '@/lib/qr';

/**
 * QR image for a postcard: /api/qr/XMAS-8K42-P9QR (SVG) or ?format=png.
 * It only encodes the redeem link for a code the caller already has, so it can be public
 * and print shops can fetch it directly from the mail-merge file.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode((await params).code, config.codePrefix);
  if (!code) return new Response('Not found', { status: 404 });
  const url = redeemUrl(baseUrl(req), code, 'qr');
  const headers = { 'Cache-Control': 'public, max-age=86400' };
  if (new URL(req.url).searchParams.get('format') === 'png') {
    return new Response(new Uint8Array(await qrPng(url)), { headers: { ...headers, 'Content-Type': 'image/png' } });
  }
  return new Response(await qrSvg(url), { headers: { ...headers, 'Content-Type': 'image/svg+xml' } });
}
