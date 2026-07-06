-- WITH Welfare Mall V15 실무형 Supabase 스키마
-- SQL Editor에서 그대로 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.app_settings (
  id text primary key default 'main',
  logo_url text,
  home_badge text default 'Company Welfare Platform',
  home_title text default '회원 승인형 회사 복지몰',
  home_description text default 'Supabase 테이블 기반 실무형 복지몰입니다.',
  nightly_price integer default 270000,
  annual_night_limit integer default 10,
  bank_name text default '국민은행',
  bank_account text default '123456-01-789012',
  bank_holder text default '주식회사 위드메디컬',
  condolence_email text default 'withm1905@withmedical.com',
  vacation_email text default 'withm1905@withmedical.com',
  created_at timestamptz default now()
);

create table if not exists public.menu_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  login_id text unique not null,
  password text not null,
  dept text default '관리자',
  created_at timestamptz default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emp_no text,
  birth date,
  phone text unique not null,
  dept text,
  password text not null,
  status text default '대기',
  created_at timestamptz default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_people integer default 5,
  max_people integer default 8,
  address text,
  main_photo_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.use_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_rate integer default 0,
  payment_required boolean default true,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.season_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'dateRange',
  start_date date,
  end_date date,
  surcharge_rate integer default 0,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  room_name text,
  user_name text,
  checkin date not null,
  checkout date not null,
  nights integer default 0,
  people integer default 1,
  use_policy_id uuid references public.use_policies(id) on delete set null,
  use_type text,
  amount integer default 0,
  status text default '대기',
  qr_code text,
  checkin_status text default '미체크인',
  memo text,
  created_at timestamptz default now()
);

create table if not exists public.condolence_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.condolences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  user_name text,
  dept text,
  type text,
  event_date date,
  memo text,
  attachment_url text,
  status text default '접수완료',
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date,
  limit_count integer default 0,
  memo text,
  is_open boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.event_applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  user_name text,
  dept text,
  status text default '신청완료',
  created_at timestamptz default now()
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  category text,
  title text not null,
  rate text,
  method text,
  link text,
  created_at timestamptz default now()
);

create table if not exists public.vacation_support (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  user_name text,
  dept text,
  phone text,
  memo text,
  status text default '접수완료',
  created_at timestamptz default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  important boolean default false,
  views integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  user_name text,
  phone text,
  status text default '요청',
  created_at timestamptz default now(),
  processed_at timestamptz
);

create table if not exists public.mail_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text default 'email',
  to_email text,
  subject text,
  body text,
  attachment_url text,
  status text default '대기',
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text,
  detail text,
  created_at timestamptz default now()
);

insert into public.app_settings (id) values ('main') on conflict (id) do nothing;
insert into public.admins (name, login_id, password)
values ('김경진','with1905','withm*1905') on conflict (login_id) do nothing;

insert into public.menu_settings (key,name,enabled) values
('stay','숙소예약',true),('family','경조사',true),('event','행사',true),
('discount','할인',true),('vacation','휴가지원사업',true),('notice','공지',true)
on conflict (key) do nothing;

insert into public.rooms (name,base_people,max_people,address) values
('스텔라동',5,8,'제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션'),
('솔라동',5,8,'제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션')
on conflict do nothing;

insert into public.use_policies (name,discount_rate,payment_required,description) values
('본인 사용',100,false,'임직원 본인 사용 무료'),
('직계가족',100,false,'직계가족 사용 무료'),
('지인',50,true,'지인 이용 시 50% 할인 금액 입금')
on conflict do nothing;

insert into public.condolence_types (name,description) values
('결혼','결혼 축하 지원'),('출산','출산 축하 지원'),('장례','장례 지원'),('생일','생일 복지'),('기타','기타')
on conflict (name) do nothing;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('welfare-files','welfare-files',true)
on conflict (id) do nothing;

-- MVP RLS: anon 읽기/쓰기 허용. 실제 운영 전 Cloudflare Access 또는 Auth/RLS 강화 권장.
alter table public.app_settings enable row level security;
alter table public.menu_settings enable row level security;
alter table public.admins enable row level security;
alter table public.employees enable row level security;
alter table public.rooms enable row level security;
alter table public.use_policies enable row level security;
alter table public.room_blocks enable row level security;
alter table public.season_rates enable row level security;
alter table public.reservations enable row level security;
alter table public.condolence_types enable row level security;
alter table public.condolences enable row level security;
alter table public.events enable row level security;
alter table public.event_applications enable row level security;
alter table public.discounts enable row level security;
alter table public.vacation_support enable row level security;
alter table public.notices enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.mail_outbox enable row level security;
alter table public.audit_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['app_settings','menu_settings','admins','employees','rooms','use_policies','room_blocks','season_rates','reservations','condolence_types','condolences','events','event_applications','discounts','vacation_support','notices','password_reset_requests','mail_outbox','audit_logs'] loop
    execute format('drop policy if exists %I on public.%I', 'anon_all_'||t, t);
    execute format('create policy %I on public.%I for all to anon using (true) with check (true)', 'anon_all_'||t, t);
  end loop;
end $$;

drop policy if exists "welfare_files_public_read" on storage.objects;
drop policy if exists "welfare_files_public_insert" on storage.objects;
drop policy if exists "welfare_files_public_update" on storage.objects;
drop policy if exists "welfare_files_public_delete" on storage.objects;

create policy "welfare_files_public_read" on storage.objects for select to anon using (bucket_id='welfare-files');
create policy "welfare_files_public_insert" on storage.objects for insert to anon with check (bucket_id='welfare-files');
create policy "welfare_files_public_update" on storage.objects for update to anon using (bucket_id='welfare-files') with check (bucket_id='welfare-files');
create policy "welfare_files_public_delete" on storage.objects for delete to anon using (bucket_id='welfare-files');
