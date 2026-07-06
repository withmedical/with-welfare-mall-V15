-- WITH Welfare Mall V15.3 Stable schema
-- V12/V13의 완성 기능을 유지하면서 Supabase에는 app_state 1개로 안정 저장합니다.
-- SQL Editor에서 그대로 실행하세요.

create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "with_welfare_app_state_select" on public.app_state;
drop policy if exists "with_welfare_app_state_insert" on public.app_state;
drop policy if exists "with_welfare_app_state_update" on public.app_state;

create policy "with_welfare_app_state_select"
on public.app_state for select
to anon
using (id = 'main');

create policy "with_welfare_app_state_insert"
on public.app_state for insert
to anon
with check (id = 'main');

create policy "with_welfare_app_state_update"
on public.app_state for update
to anon
using (id = 'main')
with check (id = 'main');

insert into public.app_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
