-- ============================================================
-- EcoTrack Novatic — Waitlist schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- Atomic, race-safe waitlist position counter.
-- Using a sequence means two simultaneous signups can never get the
-- same position, without needing to lock the table.
create sequence if not exists waitlist_position_seq start 1;

create table if not exists waitlist (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),

  organization_name  text not null,
  contact_person     text not null,
  email              text not null,
  phone_number       text,
  country            text not null,
  organization_type  text not null,
  expected_trees     text not null,
  founding_partner   boolean not null default false,

  status             text not null default 'pending', -- pending | confirmed | invited | onboarded
  source             text default 'landing_page',       -- landing_page | referral | import
  notes              text,

  referral_code      text not null unique,
  referred_by        text references waitlist(referral_code),
  referral_count     integer not null default 0,
  waitlist_position  integer not null default nextval('waitlist_position_seq'),

  -- audit fields used for spam / rate-limit checks, not shown in UI
  signup_ip          text,
  user_agent         text,

  constraint waitlist_email_unique unique (lower(email))
);

create index if not exists idx_waitlist_email on waitlist (lower(email));
create index if not exists idx_waitlist_country on waitlist (country);
create index if not exists idx_waitlist_org_type on waitlist (organization_type);
create index if not exists idx_waitlist_referral_code on waitlist (referral_code);
create index if not exists idx_waitlist_referred_by on waitlist (referred_by);
create index if not exists idx_waitlist_created_at on waitlist (created_at desc);

-- Lightweight log used purely for rate limiting / abuse detection.
-- Kept separate from `waitlist` so failed/blocked attempts don't
-- pollute your real signup data.
create table if not exists submission_log (
  id          bigint generated always as identity primary key,
  ip          text not null,
  email       text,
  created_at  timestamptz not null default now(),
  outcome     text not null -- accepted | rejected_duplicate | rejected_honeypot | rejected_rate_limit | rejected_invalid
);

create index if not exists idx_submission_log_ip_time on submission_log (ip, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Intentionally NO insert/select policies for anon or authenticated
-- roles. All reads and writes go through serverless API routes using
-- the Supabase *service role* key, which bypasses RLS by design.
-- This means: even if your anon/public key leaks, nobody can read or
-- write waitlist rows directly from the browser or Postgres API.

alter table waitlist enable row level security;
alter table submission_log enable row level security;

-- (No policies created on purpose — default-deny for anon/authenticated.)

-- ============================================================
-- Atomic referral counter
-- ============================================================
-- Do NOT increment referral_count with a read-then-write from the API layer —
-- two simultaneous referrals could both read the same value and one increment
-- would be lost. This function does it in a single atomic statement instead.
create or replace function increment_referral_count(p_referral_code text)
returns waitlist
language plpgsql
as $$
declare
  updated_row waitlist;
begin
  update waitlist
  set referral_count = referral_count + 1
  where referral_code = p_referral_code
  returning * into updated_row;

  return updated_row;
end;
$$;
