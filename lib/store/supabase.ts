import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { defaultSettings, mergeSettings, type CampaignSettings } from '../settings';
import type { Channel, CodeRow, ListQuery, NewCode, Stats, Store } from './types';

const COLUMNS =
  'id,code,name,email,address1,city,state,zip,status,source,claimed_at,claim_ip,gift_status,order_id,reward_link,gift_error,mailchimp_synced_at,created_at';
const PAGE = 1000; // Supabase returns at most 1,000 rows per request by default.

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** Postgres via Supabase. Uses the secret key, so it must only run on the server. */
export class SupabaseStore implements Store {
  readonly mode = 'supabase' as const;
  private db: SupabaseClient;

  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  private async one(column: string, value: string) {
    const { data, error } = await this.db.from('codes').select(COLUMNS).eq(column, value).maybeSingle();
    fail(error);
    return data as CodeRow | null;
  }

  find(code: string) {
    return this.one('code', code);
  }

  findById(id: string) {
    return this.one('id', id);
  }

  async claim(code: string, ip: string, source: Channel) {
    // A single UPDATE ... WHERE status = 'unused': if two requests race, only one matches.
    const { data, error } = await this.db
      .from('codes')
      .update({ status: 'pending', gift_status: 'processing', claimed_at: new Date().toISOString(), claim_ip: ip, source })
      .eq('code', code)
      .eq('status', 'unused')
      .select(COLUMNS)
      .maybeSingle();
    fail(error);
    return data as CodeRow | null;
  }

  async markIssued(id: string, orderId: string, link: string | null, giftStatus: 'sent' | 'processing') {
    const { error } = await this.db
      .from('codes')
      .update({ status: 'used', gift_status: giftStatus, order_id: orderId, reward_link: link, gift_error: null })
      .eq('id', id);
    fail(error);
  }

  async markFailed(id: string, message: string) {
    const { error } = await this.db.from('codes').update({ gift_status: 'failed', gift_error: message }).eq('id', id);
    fail(error);
  }

  async setVoid(id: string, voided: boolean) {
    const { data, error } = await this.db
      .from('codes')
      .update({ status: voided ? 'void' : 'unused' })
      .eq('id', id)
      .eq('status', voided ? 'unused' : 'void')
      .select('id');
    fail(error);
    return (data?.length ?? 0) > 0;
  }

  async list({ q, status, page, pageSize }: ListQuery) {
    let query = this.db.from('codes').select(COLUMNS, { count: 'exact' });
    if (status !== 'all') query = query.eq('status', status);
    const needle = q.toLowerCase().replace(/[%_\\]/g, '').trim();
    // "search" is a generated column: lower(code, name, email, city)
    if (needle) query = query.ilike('search', `%${needle}%`);
    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order('claimed_at', { ascending: false, nullsFirst: false })
      .order('code')
      .range(from, from + pageSize - 1);
    fail(error);
    return { rows: (data ?? []) as CodeRow[], total: count ?? 0 };
  }

  async all() {
    const rows: CodeRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.db
        .from('codes')
        .select(COLUMNS)
        .order('created_at')
        .order('code')
        .range(from, from + PAGE - 1);
      fail(error);
      rows.push(...((data ?? []) as CodeRow[]));
      if (!data || data.length < PAGE) return rows;
    }
  }

  async stats(): Promise<Stats> {
    const { data, error } = await this.db.rpc('campaign_stats');
    fail(error);
    const d = (data ?? {}) as Record<string, number>;
    const n = (k: string) => Number(d[k] ?? 0);
    return {
      total: n('total'),
      used: n('used'),
      unused: n('unused'),
      pending: n('pending'),
      void: n('void'),
      withEmail: n('with_email'),
      synced: n('synced'),
      channels: { email: n('ch_email'), qr: n('ch_qr'), web: n('ch_web') },
    };
  }

  async daily(sinceIso: string, timeZone: string) {
    const { data, error } = await this.db.rpc('daily_redemptions', { p_since: sinceIso, p_tz: timeZone });
    fail(error);
    return ((data ?? []) as { day: string; count: number | string }[]).map((d) => ({ day: d.day, count: Number(d.count) }));
  }

  async pendingRows(limit: number) {
    const { data, error } = await this.db.from('codes').select(COLUMNS).eq('status', 'pending').order('claimed_at').limit(limit);
    fail(error);
    return (data ?? []) as CodeRow[];
  }

  async recentIssued(limit: number) {
    const { data, error } = await this.db
      .from('codes')
      .select(COLUMNS)
      .eq('status', 'used')
      .order('claimed_at', { ascending: false })
      .limit(limit);
    fail(error);
    return (data ?? []) as CodeRow[];
  }

  async sampleForPostcard() {
    const { data, error } = await this.db
      .from('codes')
      .select(COLUMNS)
      .eq('status', 'unused')
      .neq('address1', '')
      .limit(1)
      .maybeSingle();
    fail(error);
    return (data as CodeRow | null) ?? (await this.list({ q: '', status: 'all', page: 1, pageSize: 1 })).rows[0] ?? null;
  }

  async insert(rows: NewCode[]) {
    let skipped = 0;
    const codes = new Set<string>();
    const emails = new Set<string>();
    const batch: NewCode[] = [];
    for (const r of rows) {
      const email = r.email.toLowerCase();
      if (codes.has(r.code) || (email && emails.has(email))) {
        skipped++;
        continue;
      }
      codes.add(r.code);
      if (email) emails.add(email);
      batch.push({ ...r, email });
    }

    // Clients already in the table (same email) are skipped so re-imports are safe.
    const existing = new Set<string>();
    const list = [...emails];
    for (let i = 0; i < list.length; i += 200) {
      const { data, error } = await this.db.from('codes').select('email').in('email', list.slice(i, i + 200));
      fail(error);
      for (const d of data ?? []) existing.add((d as { email: string }).email);
    }
    const fresh = batch.filter((r) => !(r.email && existing.has(r.email)));
    skipped += batch.length - fresh.length;

    let added = 0;
    for (let i = 0; i < fresh.length; i += 500) {
      const { data, error } = await this.db
        .from('codes')
        .upsert(fresh.slice(i, i + 500), { onConflict: 'code', ignoreDuplicates: true })
        .select('id');
      fail(error);
      added += data?.length ?? 0;
    }
    skipped += fresh.length - added;
    return { added, skipped };
  }

  async unsynced(limit: number) {
    const { data, error } = await this.db
      .from('codes')
      .select(COLUMNS)
      .neq('email', '')
      .neq('status', 'void')
      .is('mailchimp_synced_at', null)
      .limit(limit);
    fail(error);
    return (data ?? []) as CodeRow[];
  }

  async markSynced(ids: string[]) {
    const now = new Date().toISOString();
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await this.db.from('codes').update({ mailchimp_synced_at: now }).in('id', ids.slice(i, i + 200));
      fail(error);
    }
  }

  async recordFailure(key: string) {
    const { error } = await this.db.from('claim_failures').insert({ ip: key });
    fail(error);
  }

  async countFailures(key: string, sinceIso: string) {
    const { count, error } = await this.db
      .from('claim_failures')
      .select('id', { count: 'exact', head: true })
      .eq('ip', key)
      .gte('created_at', sinceIso);
    fail(error);
    return count ?? 0;
  }

  async sampleUnused() {
    const { data, error } = await this.db.from('codes').select('code').eq('status', 'unused').limit(25);
    fail(error);
    const pool = (data ?? []) as { code: string }[];
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].code : null;
  }

  async getSettings() {
    const { data, error } = await this.db.from('settings').select('data').eq('id', 1).maybeSingle();
    fail(error);
    const saved = (data as { data: Record<string, unknown> } | null)?.data;
    return saved ? mergeSettings(defaultSettings(), saved) : defaultSettings();
  }

  async saveSettings(settings: CampaignSettings) {
    const { error } = await this.db.from('settings').upsert({ id: 1, data: settings, updated_at: new Date().toISOString() });
    fail(error);
  }
}
