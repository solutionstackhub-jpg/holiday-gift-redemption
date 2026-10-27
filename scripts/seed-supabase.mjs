// Loads the same 4,000 demo records into Supabase.
// Usage: npm run seed            (only if the table is empty)
//        npm run seed -- --force (wipes codes and attempts first)
import { createClient } from '@supabase/supabase-js';
import { buildDemoRecords } from '../lib/demo-data.mjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.');
  process.exit(1);
}

const prefix = (process.env.CODE_PREFIX || 'XMAS').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'XMAS';
const force = process.argv.includes('--force');
const db = createClient(url, key, { auth: { persistSession: false } });

const { count, error } = await db.from('codes').select('id', { count: 'exact', head: true });
if (error) {
  console.error(`Supabase: ${error.message}`);
  console.error('Did you run supabase/schema.sql in the SQL editor?');
  process.exit(1);
}

if (count && !force) {
  console.log(`The codes table already has ${count} rows. Run "npm run seed -- --force" to wipe and reload.`);
  process.exit(0);
}

if (force) {
  const wipe = await db.from('codes').delete().not('id', 'is', null);
  if (wipe.error) throw new Error(wipe.error.message);
  const wipeFailures = await db.from('claim_failures').delete().gte('id', 0);
  if (wipeFailures.error) throw new Error(wipeFailures.error.message);
}

const rows = buildDemoRecords({ prefix });
for (let i = 0; i < rows.length; i += 500) {
  const res = await db.from('codes').insert(rows.slice(i, i + 500));
  if (res.error) throw new Error(res.error.message);
  process.stdout.write(`\rInserted ${Math.min(i + 500, rows.length)} / ${rows.length}`);
}
console.log(`\nDone. Try codes ${prefix}-JOLY-2026, ${prefix}-POST-2026 (no email) and ${prefix}-USED-2026 (already used).`);
