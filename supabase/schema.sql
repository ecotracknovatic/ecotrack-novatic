-- ============================================================
-- EcoTrack Novatic — Waitlist schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- Atomic, race-safe waitlist position counter.
create sequence if not exists waitlist_position_seq start 1;

create table if not exists waitlist (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),

  organization_name   text not null,
  contact_person      text not null,
  email               text not null,
  phone_number        text,
  country             text not null,
  organization_type   text not null,
  expected_trees      text not null,
  founding_partner    boolean not null default false,

  status              text not null default 'pending', 
  source              text default 'landing_page',     
  notes               text,

  referral_code       text not null unique,
  referred_by         text references waitlist(referral_code),
  referral_count      integer not null default 0,
  waitlist_position   integer not null default nextval('waitlist_position_seq'),

  -- audit fields used for spam / rate-limit checks, not shown in UI
  signup_ip           text,
  user_agent          text
  
  -- REMOVED: constraint waitlist_email_unique unique (lower(email))
);

-- CHANGED: Added UNIQUE here to enforce case-insensitive uniqueness
create unique index if not exists idx_waitlist_email_unique on waitlist (lower(email));

create index if not exists idx_waitlist_country on waitlist (country);
create index if not exists idx_waitlist_org_type on waitlist (organization_type);
create index if not exists idx_waitlist_referral_code on waitlist (referral_code);
create index if not exists idx_waitlist_referred_by on waitlist (referred_by);
create index if not exists idx_waitlist_created_at on waitlist (created_at desc);

-- Lightweight log used purely for rate limiting / abuse detection.
create table if not exists submission_log (
  id          bigint generated always as identity primary key,
  ip          text not null,
  email       text,
  created_at  timestamptz not null default now(),
  outcome     text not null 
);

create index if not exists idx_submission_log_ip_time on submission_log (ip, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table waitlist enable row level security;
alter table submission_log enable row level security;

-- ============================================================
-- Atomic referral counter
-- ============================================================
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
