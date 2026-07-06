create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
drop policy if exists "with_welfare_app_state_select" on public.app_state;
drop policy if exists "with_welfare_app_state_insert" on public.app_state;
drop policy if exists "with_welfare_app_state_update" on public.app_state;
create policy "with_welfare_app_state_select" on public.app_state for select to anon using (id='main');
create policy "with_welfare_app_state_insert" on public.app_state for insert to anon with check (id='main');
create policy "with_welfare_app_state_update" on public.app_state for update to anon using (id='main') with check (id='main');
insert into public.app_state (id,data) values ('main','{}'::jsonb) on conflict (id) do nothing;
