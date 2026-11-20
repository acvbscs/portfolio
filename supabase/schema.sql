-- =========================================================================
-- Portfolio contact schema. Run once in the Supabase SQL editor.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- =========================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- Messages. No raw IP addresses are stored.
-- --------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  email       text not null check (char_length(btrim(email)) between 3 and 254),
  message     text not null check (char_length(btrim(message)) between 1 and 4000),
  status      text not null default 'new'
                check (status in ('new', 'read', 'archived', 'spam')),
  source      text not null default 'site' check (source in ('site')),
  verified_at timestamptz,
  ip_hash     text
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- --------------------------------------------------------------------------
-- Per-hashed-IP rate limit window.
-- --------------------------------------------------------------------------
create table if not exists public.contact_rate_limits (
  ip_hash      text primary key,
  hits         integer not null default 1,
  window_start timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Atomic gate. SECURITY DEFINER is required so it can write to the
-- rate-limit table regardless of caller privileges. It is revoked from all
-- public roles and granted only to service_role.
-- --------------------------------------------------------------------------
create or replace function public.contact_rate_gate(
  p_ip_hash text,
  p_max integer default 3,
  p_window_seconds integer default 600
) returns boolean
language sql
security definer
set search_path = public
as $$
  with u as (
    insert into public.contact_rate_limits (ip_hash, hits, window_start)
    values (p_ip_hash, 1, now())
    on conflict (ip_hash) do update
      set hits = case
                   when public.contact_rate_limits.window_start
                        < now() - (p_window_seconds || ' seconds')::interval
                   then 1
                   else public.contact_rate_limits.hits + 1
                 end,
          window_start = case
                   when public.contact_rate_limits.window_start
                        < now() - (p_window_seconds || ' seconds')::interval
                   then now()
                   else public.contact_rate_limits.window_start
                 end
    returning hits
  )
  select hits <= p_max from u;
$$;

-- --------------------------------------------------------------------------
-- Row Level Security. RLS is ON with NO public policies: neither anon nor
-- authenticated clients can read or write. The serverless function uses the
-- service-role key, which bypasses RLS by design.
-- --------------------------------------------------------------------------
alter table public.contact_messages    enable row level security;
alter table public.contact_rate_limits enable row level security;

revoke all on function public.contact_rate_gate(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.contact_rate_gate(text, integer, integer)
  to service_role;

grant all on public.contact_messages, public.contact_rate_limits to service_role;

-- Intentionally no policies:
--   no "select" policy  -> nobody can read submissions from the browser
--   no "insert" policy  -> the honeypot / Turnstile / rate gate cannot be bypassed
