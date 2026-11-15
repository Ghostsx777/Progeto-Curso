-- DevPath Academy: esquema inicial. Revise e teste antes de produção.
create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'admin');
create type public.item_status as enum ('not_started', 'in_progress', 'watched', 'submitted', 'under_review', 'approved', 'failed', 'needs_revision');
create type public.module_status as enum ('locked', 'available', 'in_progress', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  sort_order int not null unique,
  preview text not null default '',
  pass_mark numeric(5,2) not null default 70 check (pass_mark between 0 and 100),
  published boolean not null default false
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  body_md text not null default '',
  sort_order int not null,
  estimated_minutes int not null default 45,
  required boolean not null default true,
  unique(module_id, sort_order)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  activity_type text not null check (activity_type in ('exercise','project','quiz','exam')),
  instructions_md text not null default '',
  weight numeric(5,2) not null default 0 check (weight between 0 and 100),
  required boolean not null default true,
  sort_order int not null,
  max_attempts int not null default 3
);

create table public.student_module_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  status public.module_status not null default 'locked',
  started_at timestamptz,
  completed_at timestamptz,
  final_grade numeric(5,2) check (final_grade between 0 and 100),
  primary key(student_id, module_id)
);

create table public.lesson_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status public.item_status not null default 'not_started',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(student_id, lesson_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  attempt_no int not null,
  submission_text text,
  submission_url text,
  status public.item_status not null default 'submitted',
  grade numeric(5,2) check (grade between 0 and 100),
  feedback text,
  submitted_at timestamptz not null default now(),
  graded_by uuid references public.profiles(id),
  graded_at timestamptz,
  unique(student_id, activity_id, attempt_no)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.lessons(module_id, sort_order);
create index on public.activities(module_id, sort_order);
create index on public.submissions(student_id, submitted_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.activities enable row level security;
alter table public.student_module_progress enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.audit_log enable row level security;

-- Perfis: aluno vê/edita apenas o próprio nome; admin vê todos.
create policy "profile read self or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "profile update self or admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Conteúdo publicado pode ser lido por alunos autenticados; admin gerencia.
create policy "published modules read" on public.modules
for select using (published = true or public.is_admin());
create policy "admin manages modules" on public.modules
for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons read authenticated" on public.lessons
for select using (auth.uid() is not null);
create policy "admin manages lessons" on public.lessons
for all using (public.is_admin()) with check (public.is_admin());

create policy "activities read authenticated" on public.activities
for select using (auth.uid() is not null);
create policy "admin manages activities" on public.activities
for all using (public.is_admin()) with check (public.is_admin());

-- Cada aluno vê seu progresso; admin pode acompanhar todos.
create policy "module progress read own or admin" on public.student_module_progress
for select using (student_id = auth.uid() or public.is_admin());
create policy "module progress admin manages" on public.student_module_progress
for all using (public.is_admin()) with check (public.is_admin());

create policy "lesson progress read own or admin" on public.lesson_progress
for select using (student_id = auth.uid() or public.is_admin());
create policy "lesson progress insert own" on public.lesson_progress
for insert with check (student_id = auth.uid());
create policy "lesson progress update own" on public.lesson_progress
for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "submissions read own or admin" on public.submissions
for select using (student_id = auth.uid() or public.is_admin());
create policy "students submit own work" on public.submissions
for insert with check (student_id = auth.uid());
create policy "admin grades submissions" on public.submissions
for update using (public.is_admin()) with check (public.is_admin());

create policy "admin manages invites" on public.invites
for all using (public.is_admin()) with check (public.is_admin());

create policy "admin reads audit log" on public.audit_log
for select using (public.is_admin());
create policy "admin inserts audit log" on public.audit_log
for insert with check (public.is_admin());
