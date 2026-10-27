// Shared by the app and the Supabase seed script, so it stays plain JS.

// 32 characters with no look-alikes (no I, O, 0, 1) so printed codes are easy to type.
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** @param {number} length */
export function randomChars(length) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so the modulo has no bias.
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/**
 * PREFIX-XXXX-XXXX: 8 random characters, about 1 trillion combinations.
 * @param {string} prefix
 */
export function generateCode(prefix) {
  const body = randomChars(8);
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/**
 * Same format, but from a seeded random function. Only for demo data, so every server
 * instance builds the identical 4,000 sample codes. Real codes use generateCode().
 * @param {() => number} rand
 * @param {string} prefix
 */
export function codeFromRandom(rand, prefix) {
  let body = '';
  for (let i = 0; i < 8; i++) body += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** UUID-shaped id from a seeded random function (demo data only). @param {() => number} rand */
export function idFromRandom(rand) {
  let h = '';
  for (let i = 0; i < 32; i++) h += Math.floor(rand() * 16).toString(16);
  const variant = '89ab'[Math.floor(rand() * 4)];
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
