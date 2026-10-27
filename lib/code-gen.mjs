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
