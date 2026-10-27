import { generateCode } from './code-gen.mjs';

const DAY = 86_400_000;

const FIRST = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Ashley', 'Robert', 'Amanda', 'William', 'Megan', 'Joseph', 'Lauren', 'Daniel', 'Brittany', 'Matthew', 'Rachel', 'Christopher', 'Hannah', 'Andrew', 'Olivia', 'Joshua', 'Grace', 'Brandon', 'Natalie', 'Tyler', 'Victoria', 'Kevin', 'Morgan', 'Denise', 'Marcus', 'Tiffany', 'Carlos', 'Angela', 'Darnell'];
const LAST = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Miller', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Ramirez', 'Brooks', 'Bennett', 'Coleman'];
const STREETS = ['Main St', 'Augusta St', 'Pelham Rd', 'Wade Hampton Blvd', 'Laurens Rd', 'Woodruff Rd', 'Haywood Rd', 'Pleasantburg Dr', 'Roper Mountain Rd', 'Church St', 'Poinsett Hwy', 'Butler Rd', 'Fairview Rd', 'Old Spartanburg Rd'];
const TOWNS = [
  ['Greenville', '29601'], ['Greenville', '29607'], ['Greenville', '29615'], ['Greer', '29650'], ['Simpsonville', '29681'],
  ['Mauldin', '29662'], ['Taylors', '29687'], ['Easley', '29640'], ['Spartanburg', '29301'], ['Travelers Rest', '29690'],
];

/** Small seeded PRNG so demo names look the same on every restart. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed codes for trying the demo. @param {string} prefix */
export function demoTestCodes(prefix) {
  return {
    unused: ['JOLY', 'SNOW', 'GIFT', 'MINT', 'STAR'].map((w) => `${prefix}-${w}-2026`),
    postcardOnly: `${prefix}-POST-2026`,
    used: `${prefix}-USED-2026`,
    void: `${prefix}-VOID-2026`,
  };
}

/**
 * 4,000 sample clients: ~20% already redeemed over the last three weeks (by email link,
 * postcard QR or typed code), two stuck "pending" after a provider error, a few postcard-only
 * clients with no email, and a handful recently imported but not yet pushed to Mailchimp.
 */
export function buildDemoRecords({ prefix = 'XMAS', total = 4000, used = 823, pending = 2, now = Date.now() } = {}) {
  const rand = seeded(2026);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const createdAt = new Date(now - 25 * DAY).toISOString();
  const syncedAt = new Date(now - 24 * DAY).toISOString();
  const seen = new Set();
  const records = [];

  const orderId = () => `DEMO-ORD-${Math.floor(rand() * 1e8).toString(36).toUpperCase().padStart(6, '0')}`;
  // More claims closer to today, like a real campaign after the cards land.
  const claimTime = () => new Date(now - (1 - Math.sqrt(rand())) * 21 * DAY - rand() * 3_600_000).toISOString();
  const channel = () => {
    const r = rand();
    return r < 0.5 ? 'email' : r < 0.81 ? 'qr' : 'web';
  };
  const address = () => {
    const [city, zip] = pick(TOWNS);
    return { address1: `${100 + Math.floor(rand() * 9800)} ${pick(STREETS)}`, city, state: 'SC', zip };
  };

  const push = (code, name, email, extra = {}) => {
    seen.add(code);
    const id = globalThis.crypto.randomUUID();
    const row = {
      id,
      code,
      name,
      email,
      ...address(),
      status: 'unused',
      source: null,
      claimed_at: null,
      claim_ip: null,
      gift_status: 'none',
      order_id: null,
      reward_link: null,
      gift_error: null,
      mailchimp_synced_at: email ? syncedAt : null,
      created_at: createdAt,
      ...extra,
    };
    if (row.status === 'used' && !row.reward_link) row.reward_link = `/gift/${id}`;
    records.push(row);
  };

  const test = demoTestCodes(prefix);
  const testers = ['Linda Carter', 'Mark Evans', 'Susan Reed', 'Paul Turner', 'Karen Brooks'];
  test.unused.forEach((code, i) => push(code, testers[i], `${testers[i].replace(' ', '.').toLowerCase()}@example.com`));
  push(test.postcardOnly, 'Patricia Moore', ''); // postcard only, no email on file
  push(test.used, 'Robert Hayes', 'robert.hayes@example.com', {
    status: 'used', source: 'qr', claimed_at: new Date(now - 3 * DAY).toISOString(), gift_status: 'sent', order_id: orderId(),
  });
  push(test.void, 'Duplicate Record', 'duplicate.record@example.com', { status: 'void' });

  let usedLeft = used - 1;
  let pendingLeft = pending;
  let unsyncedLeft = 14;
  let n = 0;
  while (records.length < total) {
    let code = generateCode(prefix);
    while (seen.has(code)) code = generateCode(prefix);
    const first = pick(FIRST);
    const last = pick(LAST);
    n += 1;
    const hasEmail = rand() > 0.06;
    const email = hasEmail ? `${first}.${last}${n}@example.com`.toLowerCase() : '';
    const name = `${first} ${last}`;

    if (usedLeft > 0 && rand() < 0.3) {
      usedLeft -= 1;
      const source = hasEmail ? channel() : rand() < 0.75 ? 'qr' : 'web';
      push(code, name, email, { status: 'used', source, claimed_at: claimTime(), gift_status: 'sent', order_id: orderId() });
    } else if (pendingLeft > 0 && hasEmail && records.length > 600) {
      pendingLeft -= 1;
      push(code, name, email, {
        status: 'pending', source: 'email', claimed_at: new Date(now - (pendingLeft + 1) * 3_600_000).toISOString(),
        gift_status: 'failed', gift_error: 'Gift card provider timed out (demo)',
      });
    } else if (unsyncedLeft > 0 && hasEmail && records.length > total - 40) {
      unsyncedLeft -= 1;
      push(code, name, email, { mailchimp_synced_at: null, created_at: new Date(now - 2 * DAY).toISOString() });
    } else {
      push(code, name, email);
    }
  }
  // If the random draw left any "used" quota, fill it from unused rows so the totals are exact.
  for (const row of records) {
    if (usedLeft <= 0) break;
    if (row.status === 'unused' && !Object.values(test).flat().includes(row.code)) {
      usedLeft -= 1;
      Object.assign(row, {
        status: 'used', source: row.email ? channel() : 'qr', claimed_at: claimTime(), gift_status: 'sent', order_id: orderId(),
        reward_link: `/gift/${row.id}`,
      });
    }
  }
  return records;
}
