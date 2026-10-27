import { config } from '../config';
import { buildDemoRecords } from '../demo-data.mjs';
import { dayKey } from '../format';
import { defaultSettings, type CampaignSettings } from '../settings';
import type { Channel, CodeRow, ListQuery, NewCode, Stats, Store } from './types';

interface MemoryState {
  rows: CodeRow[];
  byCode: Map<string, CodeRow>;
  byId: Map<string, CodeRow>;
  failures: Map<string, number[]>;
  settings: CampaignSettings;
}

// Kept on globalThis so hot reloads and different routes share one copy.
const g = globalThis as typeof globalThis & { __holidayRewardsMemory?: MemoryState };

function fresh(): MemoryState {
  const rows = buildDemoRecords({ prefix: config.codePrefix }) as CodeRow[];
  return {
    rows,
    byCode: new Map(rows.map((r) => [r.code, r])),
    byId: new Map(rows.map((r) => [r.id, r])),
    failures: new Map(),
    settings: defaultSettings(),
  };
}

function state(): MemoryState {
  g.__holidayRewardsMemory ??= fresh();
  return g.__holidayRewardsMemory;
}

/** Demo only: put the 4,000 sample records back the way they started. */
export function resetMemoryStore() {
  g.__holidayRewardsMemory = fresh();
}

const copy = (r: CodeRow | undefined) => (r ? { ...r } : null);

function mostRecentFirst(a: CodeRow, b: CodeRow) {
  if (a.claimed_at && b.claimed_at) return b.claimed_at.localeCompare(a.claimed_at);
  if (a.claimed_at) return -1;
  if (b.claimed_at) return 1;
  return a.code.localeCompare(b.code);
}

/** In-memory demo data. Resets when the server restarts. */
export class MemoryStore implements Store {
  readonly mode = 'memory' as const;

  async find(code: string) {
    return copy(state().byCode.get(code));
  }

  async findById(id: string) {
    return copy(state().byId.get(id));
  }

  async claim(code: string, ip: string, source: Channel) {
    // Check and update run without an await in between, so this is atomic in Node.
    const row = state().byCode.get(code);
    if (!row || row.status !== 'unused') return null;
    Object.assign(row, {
      status: 'pending',
      gift_status: 'processing',
      claimed_at: new Date().toISOString(),
      claim_ip: ip,
      source,
    });
    return { ...row };
  }

  async markIssued(id: string, orderId: string, link: string | null, giftStatus: 'sent' | 'processing') {
    const row = state().byId.get(id);
    if (!row) return;
    Object.assign(row, { status: 'used', gift_status: giftStatus, order_id: orderId, reward_link: link, gift_error: null });
  }

  async markFailed(id: string, error: string) {
    const row = state().byId.get(id);
    if (row) Object.assign(row, { gift_status: 'failed', gift_error: error });
  }

  async setVoid(id: string, voided: boolean) {
    const row = state().byId.get(id);
    if (!row || row.status !== (voided ? 'unused' : 'void')) return false;
    row.status = voided ? 'void' : 'unused';
    return true;
  }

  async list({ q, status, page, pageSize }: ListQuery) {
    const needle = q.trim().toLowerCase();
    const filtered = state()
      .rows.filter(
        (r) =>
          (status === 'all' || r.status === status) &&
          (!needle ||
            r.code.toLowerCase().includes(needle) ||
            r.name.toLowerCase().includes(needle) ||
            r.email.includes(needle) ||
            r.city.toLowerCase().includes(needle)),
      )
      .sort(mostRecentFirst);
    const from = (page - 1) * pageSize;
    return { rows: filtered.slice(from, from + pageSize).map((r) => ({ ...r })), total: filtered.length };
  }

  async all() {
    return state().rows.map((r) => ({ ...r }));
  }

  async stats() {
    const s: Stats = {
      total: 0, used: 0, unused: 0, pending: 0, void: 0, withEmail: 0, synced: 0,
      channels: { email: 0, qr: 0, web: 0 },
    };
    for (const r of state().rows) {
      s.total++;
      s[r.status]++;
      if (r.email) s.withEmail++;
      if (r.mailchimp_synced_at) s.synced++;
      if (r.source && (r.status === 'used' || r.status === 'pending')) s.channels[r.source]++;
    }
    return s;
  }

  async daily(sinceIso: string, timeZone: string) {
    const since = Date.parse(sinceIso);
    const byDay = new Map<string, number>();
    for (const r of state().rows) {
      if (!r.claimed_at || Date.parse(r.claimed_at) < since) continue;
      const key = dayKey(new Date(r.claimed_at), timeZone);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return [...byDay].map(([day, count]) => ({ day, count }));
  }

  async pendingRows(limit: number) {
    return state()
      .rows.filter((r) => r.status === 'pending')
      .sort((a, b) => (a.claimed_at ?? '').localeCompare(b.claimed_at ?? ''))
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async recentIssued(limit: number) {
    return state()
      .rows.filter((r) => r.status === 'used')
      .sort(mostRecentFirst)
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async sampleForPostcard() {
    const rows = state().rows;
    return copy(rows.find((r) => r.status === 'unused' && r.address1 && r.name) ?? rows[0]);
  }

  async insert(rows: NewCode[]) {
    const s = state();
    const emails = new Set(s.rows.filter((r) => r.email).map((r) => r.email));
    const now = new Date().toISOString();
    let added = 0;
    let skipped = 0;
    for (const n of rows) {
      const email = n.email.toLowerCase();
      if (s.byCode.has(n.code) || (email && emails.has(email))) {
        skipped++;
        continue;
      }
      const row: CodeRow = {
        id: crypto.randomUUID(),
        code: n.code,
        name: n.name,
        email,
        address1: n.address1 ?? '',
        city: n.city ?? '',
        state: n.state ?? '',
        zip: n.zip ?? '',
        status: 'unused',
        source: null,
        claimed_at: null,
        claim_ip: null,
        gift_status: 'none',
        order_id: null,
        reward_link: null,
        gift_error: null,
        mailchimp_synced_at: null,
        created_at: now,
      };
      s.rows.push(row);
      s.byCode.set(row.code, row);
      s.byId.set(row.id, row);
      if (email) emails.add(email);
      added++;
    }
    return { added, skipped };
  }

  async unsynced(limit: number) {
    return state()
      .rows.filter((r) => r.email && !r.mailchimp_synced_at && r.status !== 'void')
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async markSynced(ids: string[]) {
    const now = new Date().toISOString();
    for (const id of ids) {
      const row = state().byId.get(id);
      if (row) row.mailchimp_synced_at = now;
    }
  }

  async recordFailure(key: string) {
    const s = state();
    const list = s.failures.get(key) ?? [];
    list.push(Date.now());
    s.failures.set(key, list.slice(-100));
  }

  async countFailures(key: string, sinceIso: string) {
    const since = Date.parse(sinceIso);
    return (state().failures.get(key) ?? []).filter((t) => t >= since).length;
  }

  async sampleUnused() {
    const pool = state().rows.filter((r) => r.status === 'unused');
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].code : null;
  }

  async getSettings() {
    return { ...state().settings };
  }

  async saveSettings(settings: CampaignSettings) {
    state().settings = { ...settings };
  }
}
