import type { CampaignSettings } from '../settings';

/** unused → pending (locked while the gift card is ordered) → used. void = cancelled by an admin. */
export type CodeStatus = 'unused' | 'pending' | 'used' | 'void';
export type GiftStatus = 'none' | 'processing' | 'sent' | 'failed';
/** How the client reached the page: Mailchimp email link, postcard QR scan, or typed by hand. */
export type Channel = 'email' | 'qr' | 'web';

export interface CodeRow {
  id: string;
  code: string;
  name: string;
  email: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  status: CodeStatus;
  source: Channel | null;
  claimed_at: string | null;
  claim_ip: string | null;
  gift_status: GiftStatus;
  order_id: string | null;
  reward_link: string | null;
  gift_error: string | null;
  mailchimp_synced_at: string | null;
  created_at: string;
}

export interface NewCode {
  code: string;
  name: string;
  email: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ListQuery {
  q: string;
  status: 'all' | CodeStatus;
  page: number;
  pageSize: number;
}

export interface Stats {
  total: number;
  used: number;
  unused: number;
  pending: number;
  void: number;
  withEmail: number;
  synced: number;
  channels: Record<Channel, number>;
}

export interface Store {
  readonly mode: 'memory' | 'supabase';
  find(code: string): Promise<CodeRow | null>;
  findById(id: string): Promise<CodeRow | null>;
  /** Atomically moves an unused code to "pending". Returns null if it was not unused. */
  claim(code: string, ip: string, source: Channel): Promise<CodeRow | null>;
  markIssued(id: string, orderId: string, link: string | null, giftStatus: 'sent' | 'processing'): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  /** unused ↔ void only. Returns false if the code is in another state. */
  setVoid(id: string, voided: boolean): Promise<boolean>;
  list(query: ListQuery): Promise<{ rows: CodeRow[]; total: number }>;
  all(): Promise<CodeRow[]>;
  stats(): Promise<Stats>;
  daily(sinceIso: string, timeZone: string): Promise<{ day: string; count: number }[]>;
  pendingRows(limit: number): Promise<CodeRow[]>;
  recentIssued(limit: number): Promise<CodeRow[]>;
  sampleForPostcard(): Promise<CodeRow | null>;
  /** Skips duplicate codes and emails that already exist. */
  insert(rows: NewCode[]): Promise<{ added: number; skipped: number }>;
  unsynced(limit: number): Promise<CodeRow[]>;
  markSynced(ids: string[]): Promise<void>;
  recordFailure(key: string): Promise<void>;
  countFailures(key: string, sinceIso: string): Promise<number>;
  sampleUnused(): Promise<string | null>;
  getSettings(): Promise<CampaignSettings>;
  saveSettings(settings: CampaignSettings): Promise<void>;
  /** Demo only: replay a redemption this browser made on another server instance. */
  applyDemoClaim?(claim: { id: string; at: number; src: Channel }): Promise<void>;
}
