export { generateCode, randomChars } from './code-gen.mjs';

/**
 * Turns whatever the client typed into the stored format PREFIX-XXXX-XXXX.
 * Accepts lowercase, spaces, missing dashes and a missing prefix.
 */
export function normalizeCode(input: string, prefix: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let body: string;
  if (raw.length === 8) body = raw;
  else if (raw.length === prefix.length + 8 && raw.startsWith(prefix)) body = raw.slice(prefix.length);
  else return null;
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`;
}
