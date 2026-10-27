import { MemoryStore } from './memory';
import { SupabaseStore } from './supabase';
import type { Store } from './types';

let store: Store | undefined;

/** Supabase when its keys are set, otherwise in-memory demo data. */
export function getStore(): Store {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    store = url && key ? new SupabaseStore(url, key) : new MemoryStore();
  }
  return store;
}
