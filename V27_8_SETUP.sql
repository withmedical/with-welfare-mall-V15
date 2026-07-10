-- WITH Welfare Mall V27.8 서버 중심 저장 구조
create table if not exists public.reservations_v2 (
  id text primary key,
  user_id text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.benefit_applications_v2 (like public.reservations_v2 including all);
create table if not exists public.event_applications_v2 (like public.reservations_v2 including all);
create table if not exists public.notifications_v2 (like public.reservations_v2 including all);
create table if not exists public.kakao_outbox_v2 (like public.reservations_v2 including all);

alter table public.reservations_v2 disable row level security;
alter table public.benefit_applications_v2 disable row level security;
alter table public.event_applications_v2 disable row level security;
alter table public.notifications_v2 disable row level security;
alter table public.kakao_outbox_v2 disable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.reservations_v2 to anon;
grant select, insert, update, delete on public.benefit_applications_v2 to anon;
grant select, insert, update, delete on public.event_applications_v2 to anon;
grant select, insert, update, delete on public.notifications_v2 to anon;
grant select, insert, update, delete on public.kakao_outbox_v2 to anon;

insert into storage.buckets (id, name, public)
values ('benefit-evidence', 'benefit-evidence', false)
on conflict (id) do update set public = false;
