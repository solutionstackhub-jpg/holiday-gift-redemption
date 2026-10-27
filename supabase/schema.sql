-- Holiday Rewards schema. Paste into the Supabase SQL editor and run once.

create table if not exists public.codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null default '',
  email text not null default '',
  address1 text not null default '',
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  -- unused -> pending (locked while the gift card is ordered) -> used; void = cancelled by admin
  status text not null default 'unused' check (status in ('unused', 'pending', 'used', 'void')),
  -- how the client arrived: email link, postcard QR, or typed
  source text check (source in ('email', 'qr', 'web')),
  claimed_at timestamptz,
  claim_ip text,
  gift_status text not null default 'none' check (gift_status in ('none', 'processing', 'sent', 'failed')),
  order_id text,
  reward_link text,
  gift_error text,
  mailchimp_synced_at timestamptz,
  created_at timestamptz not null default now(),
  -- one lowercase column so the admin search is a single, simple filter
  search text generated always as (lower(code || ' ' || name || ' ' || email || ' ' || city)) stored
);

create index if not exists codes_status_idx on public.codes (status);
create index if not exists codes_claimed_at_idx on public.codes (claimed_at desc);
create index if not exists codes_email_idx on public.codes (email);
create index if not exists codes_unsynced_idx on public.codes (mailchimp_synced_at) where mailchimp_synced_at is null;

-- Wrong-code attempts, used for the per-visitor rate limit.
create table if not exists public.claim_failures (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists claim_failures_ip_idx on public.claim_failures (ip, created_at desc);

-- Campaign settings edited in the admin (single row).
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security on, with no policies: browsers (anon key) can't read or change
-- anything. Only the Next.js server, using the secret key, can.
alter table public.codes enable row level security;
alter table public.claim_failures enable row level security;
alter table public.settings enable row level security;

-- Redemptions per day for the dashboard chart.
create or replace function public.daily_redemptions(p_since timestamptz, p_tz text default 'America/New_York')
returns table (day date, count bigint)
language sql stable
set search_path = public
as $$
  select (claimed_at at time zone p_tz)::date as day, count(*)::bigint
  from public.codes
  where claimed_at >= p_since
  group by 1
  order by 1;
$$;

-- All dashboard counters in one query.
create or replace function public.campaign_stats()
returns json
language sql stable
set search_path = public
as $$
  select json_build_object(
    'total', count(*),
    'used', count(*) filter (where status = 'used'),
    'unused', count(*) filter (where status = 'unused'),
    'pending', count(*) filter (where status = 'pending'),
    'void', count(*) filter (where status = 'void'),
    'with_email', count(*) filter (where email <> ''),
    'synced', count(*) filter (where mailchimp_synced_at is not null),
    'ch_email', count(*) filter (where status in ('used', 'pending') and source = 'email'),
    'ch_qr', count(*) filter (where status in ('used', 'pending') and source = 'qr'),
    'ch_web', count(*) filter (where status in ('used', 'pending') and source = 'web')
  )
  from public.codes;
$$;

revoke execute on function public.daily_redemptions(timestamptz, text) from public, anon, authenticated;
revoke execute on function public.campaign_stats() from public, anon, authenticated;
grant execute on function public.daily_redemptions(timestamptz, text) to service_role;
grant execute on function public.campaign_stats() to service_role;
