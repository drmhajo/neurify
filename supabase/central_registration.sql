create extension if not exists pgcrypto;

create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 160),
  email text not null,
  phone text not null check (char_length(phone) between 7 and 32),
  job_title text not null check (char_length(job_title) between 2 and 160),
  password_hash text not null,
  password_salt text not null,
  password_iterations integer not null default 210000 check (password_iterations >= 100000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists registration_requests_email_unique
  on public.registration_requests (lower(email));

alter table public.registration_requests enable row level security;

revoke all on table public.registration_requests from anon, authenticated;
grant all on table public.registration_requests to service_role;

create or replace function public.set_registration_request_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists registration_requests_set_updated_at on public.registration_requests;
create trigger registration_requests_set_updated_at
before update on public.registration_requests
for each row execute function public.set_registration_request_updated_at();

comment on table public.registration_requests is
  'Central KSMC Neurosurgery account registration requests. Access is restricted to the service role through the central-registration Edge Function.';

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.registration_requests(id) on delete cascade,
  expo_token text not null,
  platform text not null check (platform in ('android', 'ios')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists push_devices_expo_token_unique on public.push_devices (expo_token);
create index if not exists push_devices_account_id_index on public.push_devices (account_id);
alter table public.push_devices enable row level security;
revoke all on table public.push_devices from anon, authenticated;
grant all on table public.push_devices to service_role;

create or replace function public.set_push_device_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists push_devices_set_updated_at on public.push_devices;
create trigger push_devices_set_updated_at
before update on public.push_devices
for each row execute function public.set_push_device_updated_at();

comment on table public.push_devices is
  'Firebase Cloud Messaging registration tokens for approved central accounts. Access is restricted to the service role through the central-registration Edge Function.';
