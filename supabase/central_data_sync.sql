-- Central Neurify department-sync hardening.
-- This migration never reads, deletes, or modifies existing snapshot data.

create table if not exists public.department_data_audit (
  id bigint generated always as identity primary key,
  workspace_key text not null check (workspace_key = 'ksmc-neurosurgery-pilot'),
  actor_account_id uuid not null references public.registration_requests(id) on delete restrict,
  actor_name text not null check (char_length(actor_name) between 1 and 120),
  event_type text not null check (event_type in ('snapshot_created', 'snapshot_updated')),
  snapshot_version bigint not null check (snapshot_version > 0),
  change_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists department_data_audit_workspace_created_at_idx
  on public.department_data_audit (workspace_key, created_at desc);

alter table public.department_data_audit enable row level security;
revoke all on table public.department_data_audit from anon, authenticated;

drop policy if exists "service role manages department data audit" on public.department_data_audit;
create policy "service role manages department data audit"
on public.department_data_audit
for all
to service_role
using (true)
with check (true);

create or replace function public.write_department_snapshot(
  p_workspace_key text,
  p_expected_version bigint,
  p_data jsonb,
  p_actor_account_id uuid,
  p_actor_name text,
  p_change_summary jsonb default '{}'::jsonb
)
returns table (accepted boolean, version bigint, updated_at timestamptz, updated_by text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_version bigint;
  v_updated_at timestamptz;
  v_updated_by text;
  v_event_type text;
begin
  if p_workspace_key <> 'ksmc-neurosurgery-pilot' then
    raise exception 'invalid_workspace';
  end if;
  if p_expected_version < 0 or char_length(trim(p_actor_name)) < 1 then
    raise exception 'invalid_snapshot_request';
  end if;
  if not exists (
    select 1 from public.registration_requests
    where id = p_actor_account_id and status = 'approved'
  ) then
    raise exception 'account_not_approved';
  end if;

  select s.version, s.updated_at, s.updated_by
  into v_current_version, v_updated_at, v_updated_by
  from public.department_snapshots s
  where s.workspace_key = p_workspace_key
  for update;

  if not found then
    if p_expected_version <> 0 then
      return query select false, 0::bigint, null::timestamptz, ''::text;
      return;
    end if;
    insert into public.department_snapshots (workspace_key, schema_version, data, version, updated_at, updated_by)
    values (p_workspace_key, 1, p_data, 1, timezone('utc', now()), trim(p_actor_name))
    returning department_snapshots.version, department_snapshots.updated_at, department_snapshots.updated_by
    into v_current_version, v_updated_at, v_updated_by;
    v_event_type := 'snapshot_created';
  else
    if v_current_version <> p_expected_version then
      return query select false, v_current_version, v_updated_at, v_updated_by;
      return;
    end if;
    update public.department_snapshots
    set data = p_data,
        version = v_current_version + 1,
        updated_at = timezone('utc', now()),
        updated_by = trim(p_actor_name)
    where workspace_key = p_workspace_key
    returning department_snapshots.version, department_snapshots.updated_at, department_snapshots.updated_by
    into v_current_version, v_updated_at, v_updated_by;
    v_event_type := 'snapshot_updated';
  end if;

  insert into public.department_data_audit (
    workspace_key, actor_account_id, actor_name, event_type, snapshot_version, change_summary
  ) values (
    p_workspace_key, p_actor_account_id, trim(p_actor_name), v_event_type, v_current_version, coalesce(p_change_summary, '{}'::jsonb)
  );

  return query select true, v_current_version, v_updated_at, v_updated_by;
end;
$$;

revoke all on function public.write_department_snapshot(text, bigint, jsonb, uuid, text, jsonb) from public;
grant execute on function public.write_department_snapshot(text, bigint, jsonb, uuid, text, jsonb) to service_role;
