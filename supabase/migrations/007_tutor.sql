create table public.tutor_requests(
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles(id),lesson_id uuid not null references public.lessons(id),
 status text not null default 'reserved' check(status in ('reserved','completed','failed')),
 input_tokens int not null default 0,output_tokens int not null default 0,created_at timestamptz not null default now()
);
create index tutor_requests_student_day on public.tutor_requests(student_id,created_at);
create index tutor_requests_day on public.tutor_requests(created_at);
create table public.tutor_messages(
 id bigint generated always as identity primary key,request_id uuid not null references public.tutor_requests(id),
 student_id uuid not null references public.profiles(id),lesson_id uuid not null references public.lessons(id),
 role text not null check(role in ('user','assistant')),body text not null check(length(body) between 1 and 12000),created_at timestamptz not null default now(),unique(request_id,role)
);
create index tutor_messages_history on public.tutor_messages(student_id,lesson_id,id);
alter table public.tutor_requests enable row level security;
alter table public.tutor_messages enable row level security;
revoke all on public.tutor_requests,public.tutor_messages from anon,authenticated;
grant select on public.tutor_requests,public.tutor_messages to authenticated;
grant all on public.tutor_requests,public.tutor_messages to service_role;
grant usage,select on sequence public.tutor_messages_id_seq to service_role;
create policy tutor_requests_own on public.tutor_requests for select to authenticated using(public.is_active() and student_id=auth.uid());
create policy tutor_messages_own on public.tutor_messages for select to authenticated using(public.is_active() and student_id=auth.uid());

create function public.reserve_tutor(lid uuid,question text) returns uuid language plpgsql security definer set search_path=public as $$
declare rid uuid; day_start timestamptz := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
begin
 if not public.is_active() or not exists(select 1 from public.lessons where id=lid and published and public.can_study_module(module_id)) then raise exception 'Aula indisponível'; end if;
 if question is null or length(trim(question)) not between 3 and 4000 then raise exception 'Pergunta inválida'; end if;
 perform pg_advisory_xact_lock(807716);
 if exists(select 1 from public.tutor_requests where student_id=auth.uid() and created_at>clock_timestamp()-interval '10 seconds') then raise exception 'Aguarde alguns segundos antes da próxima pergunta.'; end if;
 if (select count(*) from public.tutor_requests where student_id=auth.uid() and created_at>=day_start)>=20 then raise exception 'Limite diário de 20 perguntas atingido.'; end if;
 if (select count(*) from public.tutor_requests where created_at>=day_start)>=200 then raise exception 'Limite diário da plataforma atingido.'; end if;
 insert into public.tutor_requests(student_id,lesson_id) values(auth.uid(),lid) returning id into rid;
 insert into public.tutor_messages(request_id,student_id,lesson_id,role,body) values(rid,auth.uid(),lid,'user',trim(question));
 return rid;
end $$;
create function public.finish_tutor(rid uuid,response text,tokens_in int default 0,tokens_out int default 0) returns void language plpgsql security definer set search_path=public as $$
declare req public.tutor_requests;
begin
 select * into req from public.tutor_requests where id=rid for update;
 if req.id is null or req.status<>'reserved' then raise exception 'Invalid reservation'; end if;
 if response is null then update public.tutor_requests set status='failed' where id=rid;return;end if;
 if length(response) not between 1 and 12000 or tokens_in<0 or tokens_out<0 then raise exception 'Invalid response'; end if;
 insert into public.tutor_messages(request_id,student_id,lesson_id,role,body) values(rid,req.student_id,req.lesson_id,'assistant',response);
 update public.tutor_requests set status='completed',input_tokens=tokens_in,output_tokens=tokens_out where id=rid;
end $$;
revoke all on function public.reserve_tutor(uuid,text),public.finish_tutor(uuid,text,int,int) from public,anon,authenticated;
grant execute on function public.reserve_tutor(uuid,text) to authenticated;
grant execute on function public.finish_tutor(uuid,text,int,int) to service_role;
