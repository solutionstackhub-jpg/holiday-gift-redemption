import { generateCode } from '@/lib/codes';
import { config } from '@/lib/config';
import { adminGuard, json } from '@/lib/http';
import { fetchAudience } from '@/lib/mailchimp';
import { getStore } from '@/lib/store';

const DEMO_NAMES = ['Avery Collins', 'Jordan Price', 'Riley Foster', 'Quinn Hayes', 'Casey Morgan', 'Taylor Brooks', 'Reese Parker', 'Drew Bennett'];

/** Pulls subscribed contacts from the Mailchimp audience and gives each new one a code. */
export async function POST() {
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const stamp = Date.now().toString(36).slice(-4);
    const contacts = await fetchAudience(() =>
      DEMO_NAMES.map((name, i) => ({
        code: '',
        name,
        email: `${name.replace(' ', '.').toLowerCase()}.${stamp}${i}@example.com`,
        address1: `${120 + i * 37} Main St`,
        city: 'Greenville',
        state: 'SC',
        zip: '29601',
      })),
    );
    const { added, skipped } = await getStore().insert(contacts.map((c) => ({ ...c, code: generateCode(config.codePrefix) })));
    return json({ ok: true, found: contacts.length, added, skipped });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Import failed' }, 502);
  }
}
