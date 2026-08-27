-- Pilot-only cloud synchronization for the Neurosurgery Department app.
-- Do not upload real patient data to a trial/free Supabase project.

create table if not exists public.department_snapshots (
  workspace_key text primary key check (workspace_key = 'ksmc-neurosurgery-pilot'),
  schema_version integer not null default 1 check (schema_version = 1),
  data jsonb not null,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text not null check (char_length(updated_by) between 1 and 120)
);

alter table public.department_snapshots enable row level security;
revoke all on table public.department_snapshots from anon, authenticated;

drop policy if exists "service role manages pilot snapshots" on public.department_snapshots;
create policy "service role manages pilot snapshots"
on public.department_snapshots
for all
to service_role
using (true)
with check (true);
