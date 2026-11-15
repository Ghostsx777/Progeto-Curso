-- Preserva 001/002. Todas as mutações pedagógicas passam por funções transacionais.
alter table public.profiles add column blocked boolean not null default false;
alter table public.profiles add column email text;
create unique index one_owner on public.profiles(role) where role = 'admin';
alter table public.invites add column email text;
create table public.courses (
 id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
 description text not null default '', target_hours int not null default 234,
 weights jsonb not null default '{"exercise":20,"quiz":15,"project":35,"exam":30}',
 check ((weights->>'exercise')::numeric >= 0 and (weights->>'quiz')::numeric >= 0 and (weights->>'project')::numeric >= 0 and (weights->>'exam')::numeric >= 0),
 check ((weights->>'exercise')::numeric + (weights->>'quiz')::numeric + (weights->>'project')::numeric + (weights->>'exam')::numeric = 100),
 check (weights ?& array['exercise','quiz','project','exam'])
);
insert into public.courses(slug,title,description) values ('full-stack-90','Bootcamp Full Stack de 90 dias','13 semanas · 6 dias por semana · 3 horas por dia. O ritmo respeita a aprendizagem.');
alter table public.modules add column course_id uuid references public.courses(id);
update public.modules set course_id = (select id from public.courses where slug = 'full-stack-90');
alter table public.modules alter column course_id set not null;
alter table public.modules drop constraint modules_sort_order_key;
alter table public.modules add unique(course_id,sort_order);
alter table public.lessons add column published boolean not null default false;
alter table public.activities add column published boolean not null default false;
alter table public.activities add constraint positive_attempts check(max_attempts between 1 and 100);
alter table public.lessons add constraint positive_duration check(estimated_minutes between 1 and 1440);
alter table public.lesson_progress add column study_minutes int not null default 0 check(study_minutes between 0 and 1440);
alter table public.lesson_progress add column started_at timestamptz;
alter table public.invites add constraint invite_hash_format check(token_hash ~ '^[0-9a-f]{64}$');
create table public.notes (student_id uuid references public.profiles(id),lesson_id uuid references public.lessons(id),body text not null default '' check(length(body)<=20000),updated_at timestamptz not null default now(),primary key(student_id,lesson_id));
create table public.extra_attempts(student_id uuid references public.profiles(id),activity_id uuid references public.activities(id),extra int not null default 0 check(extra>=0),primary key(student_id,activity_id));
create table public.certificates(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles(id),course_id uuid not null references public.courses(id),full_name text not null,course_title text not null,study_minutes int not null,issued_at timestamptz not null default now(),unique(student_id,course_id));

create or replace function public.is_active() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and not blocked) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and not blocked) $$;
create function public.can_access_module(mid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_admin() or (public.is_active() and exists(select 1 from public.modules m where m.id=mid and m.published and (
 exists(select 1 from public.student_module_progress p where p.student_id=auth.uid() and p.module_id=mid and p.status in ('available','in_progress','completed'))
 or m.sort_order=(select min(sort_order) from public.modules where course_id=m.course_id and published)
 )))
$$;

-- Remove a superfície de escrita direta, inclusive privilégios por coluna herdados.
revoke all on public.profiles,public.invites,public.modules,public.lessons,public.activities,public.student_module_progress,public.lesson_progress,public.submissions,public.audit_log from anon,authenticated;
revoke update(full_name) on public.profiles from authenticated;
revoke insert(student_id,activity_id,attempt_no,submission_text,submission_url) on public.submissions from authenticated;
revoke insert(student_id,lesson_id),update(status,completed_at,updated_at) on public.lesson_progress from authenticated;
grant select on public.profiles,public.modules,public.lessons,public.activities,public.student_module_progress,public.lesson_progress,public.submissions,public.audit_log,public.courses,public.invites,public.notes,public.extra_attempts,public.certificates to authenticated;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
alter table public.courses enable row level security;
alter table public.notes enable row level security;
alter table public.extra_attempts enable row level security;
alter table public.certificates enable row level security;
create policy courses_read on public.courses for select to authenticated using(public.is_active());
create policy notes_read on public.notes for select to authenticated using(student_id=auth.uid() and public.is_active());
create policy extras_read on public.extra_attempts for select to authenticated using(public.is_admin() or (student_id=auth.uid() and public.is_active()));
create policy certs_read on public.certificates for select to authenticated using(public.is_admin() or (student_id=auth.uid() and public.is_active()));
-- Políticas restritivas acumulam-se às regras de isolamento existentes.
create policy active_profiles on public.profiles as restrictive for select to authenticated using(public.is_active());
create policy active_progress on public.student_module_progress as restrictive for select to authenticated using(public.is_active());
create policy active_lessons_progress on public.lesson_progress as restrictive for select to authenticated using(public.is_active());
create policy active_submissions on public.submissions as restrictive for select to authenticated using(public.is_active());
drop policy "published modules read" on public.modules;
create policy "published modules read" on public.modules for select to authenticated using(public.is_admin() or (public.is_active() and published));
drop policy "lessons read unlocked module or admin" on public.lessons;
create policy lessons_access on public.lessons for select to authenticated using(public.is_admin() or (published and public.can_access_module(module_id)));
drop policy "activities read unlocked module or admin" on public.activities;
create policy activities_access on public.activities for select to authenticated using(public.is_admin() or (published and public.can_access_module(module_id)));

-- Auth e consumo do convite acontecem na MESMA transação PostgreSQL.
-- raw_app_meta_data só pode ser definido pelo serviço administrativo Auth.
create function public.on_private_signup() returns trigger language plpgsql security definer set search_path=public as $$
declare invite public.invites; new_role public.app_role := 'student';
begin
 if new.raw_app_meta_data->>'bootstrap_owner'='true' then
   perform pg_advisory_xact_lock(918235);
   if exists(select 1 from public.profiles where role='admin') then raise exception 'Owner already exists'; end if;
   new_role := 'admin';
 else
   select * into invite from public.invites where token_hash=new.raw_app_meta_data->>'invite_hash' for update;
   if invite.id is null or invite.used_at is not null or invite.revoked_at is not null or invite.expires_at<=now() or (invite.email is not null and lower(invite.email)<>lower(new.email)) then raise exception 'Invalid invitation'; end if;
 end if;
 insert into public.profiles(id,full_name,email,role) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Aluno'),120),new.email,new_role);
 if new_role='student' then
   update public.invites set used_at=now(),used_by=new.id where id=invite.id;
   insert into public.audit_log(actor_id,action,target_type,target_id) values(new.id,'invite.accepted','invite',invite.id::text);
 end if;
 return new;
end $$;
create trigger private_signup after insert on auth.users for each row execute function public.on_private_signup();

create function public.create_invite(hash text,valid_days int,bound_email text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare iid uuid;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if valid_days not between 1 and 30 or hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid invitation'; end if;
 insert into public.invites(token_hash,created_by,expires_at,email) values(hash,auth.uid(),now()+make_interval(days=>valid_days),nullif(lower(bound_email),'')) returning id into iid;
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),'invite.created','invite',iid::text);
 return iid;
end $$;
create function public.revoke_invite(iid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 update public.invites set revoked_at=now() where id=iid and used_at is null;
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),'invite.revoked','invite',iid::text);
end $$;

create function public.recalculate_module(sid uuid,mid uuid) returns void language plpgsql security definer set search_path=public as $$
declare score numeric; threshold numeric; cid uuid; next_id uuid; weights jsonb;
begin
 select m.pass_mark,m.course_id,c.weights into threshold,cid,weights from public.modules m join public.courses c on c.id=m.course_id where m.id=mid;
 -- Não concluir módulos vazios ou sem projeto/prova obrigatórios.
 if not exists(select 1 from public.lessons where module_id=mid and required and published) or
    not exists(select 1 from public.activities where module_id=mid and required and published and activity_type='project') or
    not exists(select 1 from public.activities where module_id=mid and required and published and activity_type='exam') then return; end if;
 if exists(select 1 from public.lessons l where l.module_id=mid and l.required and l.published and not exists(select 1 from public.lesson_progress p where p.student_id=sid and p.lesson_id=l.id and p.completed_at is not null)) then return; end if;
 if exists(select 1 from public.activities a where a.module_id=mid and a.required and a.published and not exists(select 1 from public.submissions s where s.student_id=sid and s.activity_id=a.id and s.status='approved' and s.grade>=threshold)) then return; end if;
 -- Melhor tentativa aprovada; ausência de categoria conta como zero, sem redistribuir pesos.
 select coalesce(sum(category.mean_grade*(weights->>category.activity_type)::numeric/100),0) into score from (
   select x.activity_type,avg(x.best) mean_grade from (
     select a.id,a.activity_type,coalesce(max(s.grade) filter(where s.status='approved'),0) best
     from public.activities a left join public.submissions s on s.activity_id=a.id and s.student_id=sid
     where a.module_id=mid and a.published group by a.id
   ) x group by x.activity_type
 ) category;
 if score<threshold then return; end if;
 insert into public.student_module_progress(student_id,module_id,status,started_at,completed_at,final_grade) values(sid,mid,'completed',now(),now(),score)
 on conflict(student_id,module_id) do update set status='completed',completed_at=coalesce(student_module_progress.completed_at,now()),final_grade=score;
 select id into next_id from public.modules where course_id=cid and published and sort_order>(select sort_order from public.modules where id=mid) order by sort_order limit 1;
 if next_id is not null then insert into public.student_module_progress(student_id,module_id,status) values(sid,next_id,'available') on conflict do nothing; end if;
 insert into public.audit_log(actor_id,action,target_type,target_id,details) values(auth.uid(),'module.completed','module',mid::text,jsonb_build_object('student_id',sid,'grade',score));
end $$;

create function public.lesson_event(lid uuid,complete boolean default false,minutes int default 0) returns void language plpgsql security definer set search_path=public as $$
declare mid uuid; duration int;
begin
 select module_id,estimated_minutes into mid,duration from public.lessons where id=lid and published;
 if mid is null or not public.is_active() or not public.can_access_module(mid) then raise exception 'Forbidden'; end if;
 if minutes<0 or minutes>duration then raise exception 'Invalid study time'; end if;
 insert into public.lesson_progress(student_id,lesson_id,status,started_at,completed_at,study_minutes)
 values(auth.uid(),lid,case when complete then 'watched'::public.item_status else 'in_progress'::public.item_status end,now(),case when complete then now() end,minutes)
 on conflict(student_id,lesson_id) do update set status=case when complete or lesson_progress.completed_at is not null then 'watched'::public.item_status else 'in_progress'::public.item_status end,completed_at=case when complete then coalesce(lesson_progress.completed_at,now()) else lesson_progress.completed_at end,study_minutes=greatest(lesson_progress.study_minutes,minutes),updated_at=now();
 insert into public.student_module_progress(student_id,module_id,status,started_at) values(auth.uid(),mid,'in_progress',now()) on conflict(student_id,module_id) do update set status=case when student_module_progress.status='completed' then 'completed'::public.module_status else 'in_progress'::public.module_status end,started_at=coalesce(student_module_progress.started_at,now());
 update public.profiles set last_seen_at=now() where id=auth.uid();
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),case when complete then 'lesson.completed' else 'lesson.started' end,'lesson',lid::text);
 perform public.recalculate_module(auth.uid(),mid);
end $$;
create function public.submit_activity(aid uuid,answer text,link text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare act public.activities; attempt int; sid uuid;
begin
 select * into act from public.activities where id=aid and published;
 if act.id is null or not public.is_active() or not public.can_access_module(act.module_id) then raise exception 'Forbidden'; end if;
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
create function public.grade_submission(subid uuid,mark numeric,comment text,result text) returns void language plpgsql security definer set search_path=public as $$
declare s public.submissions; mid uuid; threshold numeric;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if mark not between 0 and 100 or mark is null or length(trim(comment))<5 or result not in ('approved','failed','needs_revision') then raise exception 'Invalid review'; end if;
 select * into s from public.submissions where id=subid for update;
 if s.id is null or s.status not in ('submitted','under_review') then raise exception 'Entrega já corrigida ou inexistente.'; end if;
 select m.id,m.pass_mark into mid,threshold from public.activities a join public.modules m on m.id=a.module_id where a.id=s.activity_id;
 if result='approved' and mark<threshold then raise exception 'Nota abaixo do mínimo.'; end if;
 update public.submissions set grade=mark,feedback=comment,status=result::public.item_status,graded_by=auth.uid(),graded_at=now() where id=subid;
 insert into public.audit_log(actor_id,action,target_type,target_id,details) values(auth.uid(),'submission.graded','submission',subid::text,jsonb_build_object('grade',mark,'feedback',comment,'status',result));
 perform public.recalculate_module(s.student_id,mid);
end $$;
create function public.save_note(lid uuid,content text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_active() or not exists(select 1 from public.lessons where id=lid and published and public.can_access_module(module_id)) then raise exception 'Forbidden'; end if;
 insert into public.notes(student_id,lesson_id,body) values(auth.uid(),lid,content) on conflict(student_id,lesson_id) do update set body=content,updated_at=now();
end $$;
create function public.admin_exception(sid uuid,kind text,target uuid,reason text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() or length(trim(reason))<10 then raise exception 'Forbidden or missing justification'; end if;
 if not exists(select 1 from public.profiles where id=sid and role='student') then raise exception 'Invalid student'; end if;
 if kind='unlock' then
   insert into public.student_module_progress(student_id,module_id,status) values(sid,target,'available') on conflict(student_id,module_id) do update set status=case when student_module_progress.status='completed' then 'completed'::public.module_status else 'available'::public.module_status end;
 elsif kind='attempt' then
   insert into public.extra_attempts(student_id,activity_id,extra) values(sid,target,1) on conflict(student_id,activity_id) do update set extra=extra_attempts.extra+1;
 elsif kind in ('block','unblock') then update public.profiles set blocked=(kind='block') where id=sid;
 else raise exception 'Invalid action'; end if;
 insert into public.audit_log(actor_id,action,target_type,target_id,details) values(auth.uid(),'admin.'||kind,'student',sid::text,jsonb_build_object('reason',reason,'target',target));
end $$;

create function public.issue_certificate(sid uuid,cid uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare cert uuid; mins int;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if not exists(select 1 from public.modules where course_id=cid) or exists(select 1 from public.modules m where m.course_id=cid and (not m.published or not exists(select 1 from public.student_module_progress p where p.module_id=m.id and p.student_id=sid and p.status='completed'))) then raise exception 'Formação ainda não concluída.'; end if;
 select coalesce(sum(p.study_minutes),0) into mins from public.lesson_progress p join public.lessons l on l.id=p.lesson_id join public.modules m on m.id=l.module_id where p.student_id=sid and m.course_id=cid and p.completed_at is not null;
 insert into public.certificates(student_id,course_id,full_name,course_title,study_minutes) select sid,cid,p.full_name,c.title,mins from public.profiles p cross join public.courses c where p.id=sid and c.id=cid
 on conflict(student_id,course_id) do update set student_id=excluded.student_id returning id into cert;
 insert into public.audit_log(actor_id,action,target_type,target_id) values(auth.uid(),'certificate.issued','certificate',cert::text);
 return cert;
end $$;
create function public.verify_certificate(cert uuid) returns table(id uuid,full_name text,course_title text,study_minutes int,issued_at timestamptz) language sql stable security definer set search_path=public as $$ select id,full_name,course_title,study_minutes,issued_at from public.certificates where id=cert $$;

-- Sem privilégios implícitos PUBLIC em SECURITY DEFINER.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(),public.is_active(),public.can_access_module(uuid),public.create_invite(text,int,text),public.revoke_invite(uuid),public.lesson_event(uuid,boolean,int),public.submit_activity(uuid,text,text),public.grade_submission(uuid,numeric,text,text),public.save_note(uuid,text),public.admin_exception(uuid,text,uuid,text),public.issue_certificate(uuid,uuid) to authenticated;
grant execute on function public.verify_certificate(uuid) to anon,authenticated;
grant execute on all functions in schema public to service_role;
