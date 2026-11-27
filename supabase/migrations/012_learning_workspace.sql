create table public.reading_state (
 student_id uuid references public.profiles not null default auth.uid(),
 lesson_id uuid references public.lessons not null,
 section text not null default '' check(length(section)<=80),
 sections text[] not null default '{}' check(cardinality(sections)<=2000),
 seconds real not null default 0 check(seconds between 0 and 360000),
 updated_at timestamptz not null default now(),
 primary key(student_id,lesson_id)
);
create table public.study_bookmarks (
 student_id uuid references public.profiles not null default auth.uid(),
 lesson_id uuid references public.lessons not null,
 anchor text not null check(length(anchor)<=80),
 label text not null check(length(label) between 1 and 240),
 primary key(student_id,lesson_id,anchor)
);
alter table public.reading_state enable row level security;
alter table public.study_bookmarks enable row level security;
create policy personal_position on public.reading_state for all to authenticated
 using(student_id=auth.uid() and exists(select 1 from public.lessons l where l.id=lesson_id and l.published and public.can_study_module(l.module_id)))
 with check(student_id=auth.uid() and exists(select 1 from public.lessons l where l.id=lesson_id and l.published and public.can_study_module(l.module_id)));
create policy personal_bookmark on public.study_bookmarks for all to authenticated
 using(student_id=auth.uid() and exists(select 1 from public.lessons l where l.id=lesson_id and l.published and public.can_study_module(l.module_id)))
 with check(student_id=auth.uid() and exists(select 1 from public.lessons l where l.id=lesson_id and l.published and public.can_study_module(l.module_id)));
grant select,insert,update on public.reading_state to authenticated;
grant select,insert,update,delete on public.study_bookmarks to authenticated;

create table public.lesson_narrations (
 lesson_id uuid references public.lessons not null,
 revision text not null check(revision ~ '^[a-f0-9]{64}$'),
 voice text not null default 'pt_BR-faber-medium',
 status text not null check(status in ('queued','processing','preview','ready','failed')),
 object_path text, cues jsonb not null default '[]', seconds real, bytes integer,
 error text, updated_at timestamptz not null default now(), primary key(lesson_id,revision,voice)
);
alter table public.lesson_narrations enable row level security;
create policy narration_read on public.lesson_narrations for select to authenticated using(public.is_admin() or (status='ready' and exists(select 1 from public.lessons l where l.id=lesson_id and l.published and public.can_study_module(l.module_id))));
create policy narration_manage on public.lesson_narrations for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select,insert,update on public.lesson_narrations to authenticated;
grant all on public.lesson_narrations to service_role;
-- O worker cria um bucket privado. Somente o servidor emite URLs temporárias após validar o acesso à aula.
create or replace function public.save_note(lid uuid,content text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_active() or not exists(select 1 from public.lessons where id=lid and published and public.can_study_module(module_id)) then raise exception 'Forbidden'; end if;
 if content='' then delete from public.notes where student_id=auth.uid() and lesson_id=lid;
 else insert into public.notes(student_id,lesson_id,body) values(auth.uid(),lid,content) on conflict(student_id,lesson_id) do update set body=content,updated_at=now(); end if;
end $$;
