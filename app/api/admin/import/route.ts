import { generateCode, normalizeCode } from '@/lib/codes';
import { config } from '@/lib/config';
import { parseCsv } from '@/lib/csv';
import { isValidEmail } from '@/lib/format';
import { adminGuard, json } from '@/lib/http';
import { getStore } from '@/lib/store';
import type { NewCode } from '@/lib/store/types';

const MAX_BYTES = 3_000_000;
const MAX_ROWS = 20_000;

/**
 * Imports a client list. Works with a Mailchimp audience export as-is
 * ("Email Address", "First Name", "Last Name", "Address") or simple columns.
 * Clients without a code get a new one; existing emails are skipped.
 */
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: 'File is too large (max 3 MB).' }, 413);

  const rows = parseCsv(text.replace(/^﻿/, ''));
  const header = (rows.shift() ?? []).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const i = {
    email: col('email', 'emailaddress'),
    name: col('name', 'fullname', 'clientname'),
    first: col('firstname', 'first'),
    last: col('lastname', 'last'),
    code: col('code', 'giftcode'),
    address: col('address1', 'address', 'street', 'streetaddress', 'addressline1'),
    city: col('city', 'town'),
    state: col('state', 'province'),
    zip: col('zip', 'zipcode', 'postalcode', 'postcode'),
  };
  if (i.email < 0 && i.name < 0 && i.first < 0 && i.code < 0) {
    return json({ error: 'The CSV needs an email, name, or code column.' }, 400);
  }

  const out: NewCode[] = [];
  let invalid = 0;
  for (const r of rows.slice(0, MAX_ROWS)) {
    const cell = (idx: number, max = 120) => (idx >= 0 ? (r[idx] ?? '').trim().slice(0, max) : '');
    const email = cell(i.email, 254).toLowerCase();
    const name = cell(i.name) || [cell(i.first), cell(i.last)].filter(Boolean).join(' ');
    const givenCode = cell(i.code, 40);
    if ((email && !isValidEmail(email)) || (!email && !name && !givenCode)) {
      invalid++;
      continue;
    }
    const code = givenCode ? normalizeCode(givenCode, config.codePrefix) : generateCode(config.codePrefix);
    if (!code) {
      invalid++;
      continue;
    }
    out.push({ code, name, email, address1: cell(i.address), city: cell(i.city, 60), state: cell(i.state, 30), zip: cell(i.zip, 12) });
  }

  const { added, skipped } = await getStore().insert(out);
  return json({
    added,
    skipped,
    invalid: invalid + Math.max(0, rows.length - MAX_ROWS),
    total: rows.length,
  });
}
