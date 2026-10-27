import QRCode from 'qrcode';

export function redeemUrl(base: string, code: string, source: 'qr' | 'email') {
  return `${base}/?code=${encodeURIComponent(code)}&src=${source}`;
}

/** SVG markup for the postcard QR code. Generated locally, so safe to inline. */
export function qrSvg(url: string) {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b1c16', light: '#ffffff00' },
  });
}

export function qrPng(url: string) {
  return QRCode.toBuffer(url, { type: 'png', margin: 2, width: 600, errorCorrectionLevel: 'M' });
}
