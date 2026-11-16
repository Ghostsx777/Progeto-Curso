alter table public.courses add column published boolean not null default false;
alter table public.courses add column archived boolean not null default false;
create table public.enrollments (
 student_id uuid not null references public.profiles(id),course_id uuid not null references public.courses(id),
 status text not null default 'active' check(status in ('active','suspended','completed')),
 enrolled_at timestamptz not null default now(),primary key(student_id,course_id)
);
alter table public.enrollments enable row level security;
revoke all on public.enrollments from anon,authenticated;
grant select on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
create policy enrollment_read on public.enrollments for select to authenticated using(public.is_active() and (student_id=auth.uid() or public.is_admin()));
-- Preserva cursos/progresso preexistentes; novas contas escolhem a formação no catálogo.
update public.courses c set published=true where exists(select 1 from public.modules m where m.course_id=c.id and m.published);
insert into public.enrollments(student_id,course_id)
select distinct p.student_id,m.course_id from public.student_module_progress p join public.modules m on m.id=p.module_id on conflict do nothing;

create function public.enroll_course(cid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_active() or not exists(select 1 from public.courses where id=cid and published and not archived) then raise exception 'Formação indisponível'; end if;
 if exists(select 1 from public.enrollments where student_id=auth.uid() and course_id=cid and status='suspended') then raise exception 'Matrícula suspensa'; end if;
 insert into public.enrollments(student_id,course_id) values(auth.uid(),cid) on conflict do nothing;
 if found then insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),'course.enrolled','course',cid::text); end if;
end $$;

create function public.can_study_module(mid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_active() and exists(
   select 1 from public.modules m join public.enrollments e on e.course_id=m.course_id
   where m.id=mid and m.published and e.student_id=auth.uid() and e.status in ('active','completed') and (
     exists(select 1 from public.student_module_progress p where p.student_id=auth.uid() and p.module_id=mid and p.status in ('available','in_progress','completed'))
     or m.sort_order=(select min(sort_order) from public.modules where course_id=m.course_id and published)
   )
 )
$$;
create or replace function public.can_access_module(mid uuid) returns boolean language sql stable security definer set search_path=public as $$ select public.is_admin() or public.can_study_module(mid) $$;

drop policy courses_read on public.courses;
create policy courses_read on public.courses for select to authenticated using(public.is_active() and (public.is_admin() or (published and not archived) or exists(select 1 from public.enrollments where course_id=courses.id and student_id=auth.uid())));
drop policy "published modules read" on public.modules;
create policy "published modules read" on public.modules for select to authenticated using(public.is_admin() or (public.is_active() and published and exists(select 1 from public.enrollments where course_id=modules.course_id and student_id=auth.uid() and status in ('active','completed'))));
revoke all on function public.enroll_course(uuid),public.can_study_module(uuid) from public,anon;
grant execute on function public.enroll_course(uuid),public.can_study_module(uuid) to authenticated,service_role;

-- Alterações pedagógicas abaixo usam sempre can_study_module, inclusive para o proprietário.
create or replace function public.lesson_event(lid uuid,complete boolean default false,minutes int default 0) returns void language plpgsql security definer set search_path=public as $$
declare mid uuid; duration int;
begin
 select module_id,estimated_minutes into mid,duration from public.lessons where id=lid and published;
 if mid is null or not public.is_active() or not public.can_study_module(mid) then raise exception 'Forbidden'; end if;
 if minutes<0 or minutes>duration then raise exception 'Invalid study time'; end if;
 insert into public.lesson_progress(student_id,lesson_id,status,started_at,completed_at,study_minutes)
 values(auth.uid(),lid,case when complete then 'watched'::public.item_status else 'in_progress'::public.item_status end,now(),case when complete then now() end,minutes)
 on conflict(student_id,lesson_id) do update set status=case when complete or lesson_progress.completed_at is not null then 'watched'::public.item_status else 'in_progress'::public.item_status end,completed_at=case when complete then coalesce(lesson_progress.completed_at,now()) else lesson_progress.completed_at end,study_minutes=greatest(lesson_progress.study_minutes,minutes),updated_at=now();
 insert into public.student_module_progress(student_id,module_id,status,started_at) values(auth.uid(),mid,'in_progress',now()) on conflict(student_id,module_id) do update set status=case when student_module_progress.status='completed' then 'completed'::public.module_status else 'in_progress'::public.module_status end,started_at=coalesce(student_module_progress.started_at,now());
 update public.profiles set last_seen_at=now() where id=auth.uid();
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),case when complete then 'lesson.completed' else 'lesson.started' end,'lesson',lid::text);
 perform public.recalculate_module(auth.uid(),mid);
end $$;
create or replace function public.submit_activity(aid uuid,answer text,link text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare act public.activities; attempt int; sid uuid;
begin
 select * into act from public.activities where id=aid and published;
 if act.id is null or not public.is_active() or not public.can_study_module(act.module_id) then raise exception 'Forbidden'; end if;
 if length(coalesce(answer,'')) not between 10 and 100000 or (link is not null and link !~ '^https://') then raise exception 'Invalid answer'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||aid::text));
 if exists(select 1 from public.submissions where student_id=auth.uid() and activity_id=aid and status in ('submitted','under_review','approved')) then raise exception 'Existe uma entrega pendente ou aprovada.'; end if;
 select coalesce(max(attempt_no),0)+1 into attempt from public.submissions where student_id=auth.uid() and activity_id=aid;
 if attempt>act.max_attempts+coalesce((select extra from public.extra_attempts where student_id=auth.uid() and activity_id=aid),0) then raise exception 'Limite de tentativas atingido.'; end if;
 insert into public.submissions(student_id,activity_id,attempt_no,submission_text,submission_url) values(auth.uid(),aid,attempt,answer,link) returning id into sid;
 update public.profiles set last_seen_at=now() where id=auth.uid();
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),'activity.submitted','submission',sid::text);
 return sid;
end $$;
create or replace function public.save_note(lid uuid,content text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_active() or not exists(select 1 from public.lessons where id=lid and published and public.can_study_module(module_id)) then raise exception 'Forbidden'; end if;
 insert into public.notes(student_id,lesson_id,body) values(auth.uid(),lid,content) on conflict(student_id,lesson_id) do update set body=content,updated_at=now();
end $$;
create or replace function public.grade_submission(subid uuid,mark numeric,comment text,result text) returns void language plpgsql security definer set search_path=public as $$
declare s public.submissions; mid uuid; threshold numeric;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if mark not between 0 and 100 or mark is null or length(trim(comment))<5 or result not in ('approved','failed','needs_revision') then raise exception 'Invalid review'; end if;
 select * into s from public.submissions where id=subid for update;
 if s.student_id=auth.uid() then raise exception 'Não é permitido corrigir a própria entrega.'; end if;
 if s.id is null or s.status not in ('submitted','under_review') then raise exception 'Entrega já corrigida ou inexistente.'; end if;
 select m.id,m.pass_mark into mid,threshold from public.activities a join public.modules m on m.id=a.module_id where a.id=s.activity_id;
 if result='approved' and mark<threshold then raise exception 'Nota abaixo do mínimo.'; end if;
 update public.submissions set grade=mark,feedback=comment,status=result::public.item_status,graded_by=auth.uid(),graded_at=now() where id=subid;
 insert into public.audit_log(actor_id,action,target_type,target_id,details) values(auth.uid(),'submission.graded','submission',subid::text,jsonb_build_object('grade',mark,'feedback',comment,'status',result));
 perform public.recalculate_module(s.student_id,mid);
end $$;
create or replace function public.issue_certificate(sid uuid,cid uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare cert uuid; mins int;
begin
 if not public.is_active() or (not public.is_admin() and sid is distinct from auth.uid()) or not exists(select 1 from public.enrollments where student_id=sid and course_id=cid and status in ('active','completed')) then raise exception 'Forbidden'; end if;
 if not exists(select 1 from public.modules where course_id=cid) or exists(select 1 from public.modules m where m.course_id=cid and (not m.published or not exists(select 1 from public.student_module_progress p where p.module_id=m.id and p.student_id=sid and p.status='completed'))) then raise exception 'Formação ainda não concluída.'; end if;
 select coalesce(sum(p.study_minutes),0) into mins from public.lesson_progress p join public.lessons l on l.id=p.lesson_id join public.modules m on m.id=l.module_id where p.student_id=sid and m.course_id=cid and p.completed_at is not null;
 insert into public.certificates(student_id,course_id,full_name,course_title,study_minutes) select sid,cid,p.full_name,c.title,mins from public.profiles p cross join public.courses c where p.id=sid and c.id=cid
 on conflict(student_id,course_id) do update set student_id=excluded.student_id returning id into cert;
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),'certificate.issued','certificate',cert::text);
 return cert;
end $$;
