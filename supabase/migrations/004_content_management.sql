-- Edição autorizada, transacional e auditável. Não concede escrita direta às tabelas.
create function public.save_content(kind text,payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare
 item_id uuid := coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
 previous jsonb;
 parent_id uuid;
 title_text text := trim(payload->>'title');
 position int := (payload->>'sort_order')::int;
 visible boolean := coalesce((payload->>'published')::boolean,false);
 required_item boolean := coalesce((payload->>'required')::boolean,true);
 has_progress boolean;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if kind is null or kind not in ('module','lesson','activity') or title_text is null or length(title_text) not between 3 and 160 or position is null or position not between 1 and 10000 then
   raise exception 'Invalid content';
 end if;
 -- Serializa edições; o conteúdo original fica registrado para consulta/auditoria.
 perform pg_advisory_xact_lock(746810);
 if kind='module' then
   parent_id := (payload->>'course_id')::uuid;
   if parent_id is null or not exists(select 1 from public.courses where id=parent_id) then raise exception 'Invalid course'; end if;
   if payload->>'slug' is null or payload->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(payload->>'slug')>100 then raise exception 'Invalid slug'; end if;
   if (payload->>'pass_mark')::numeric is null or (payload->>'pass_mark')::numeric not between 70 and 100 then raise exception 'Invalid pass mark'; end if;
   if length(coalesce(payload->>'description',''))>5000 or length(coalesce(payload->>'preview',''))>10000 then raise exception 'Content too long'; end if;
   select to_jsonb(m) into previous from public.modules m where id=item_id for update;
   -- Não reordenar/mover módulos em formações que já possuem progresso.
   if (exists(select 1 from public.student_module_progress p join public.modules m on m.id=p.module_id where m.course_id in (parent_id,(previous->>'course_id')::uuid))
      or exists(select 1 from public.submissions s join public.activities a on a.id=s.activity_id join public.modules m on m.id=a.module_id where m.course_id in (parent_id,(previous->>'course_id')::uuid)))
      and (previous is null or (previous->>'course_id')::uuid is distinct from parent_id or (previous->>'sort_order')::int is distinct from position or (previous->>'pass_mark')::numeric is distinct from (payload->>'pass_mark')::numeric or (previous->>'published')::boolean is distinct from visible) then
      raise exception 'A formação em uso exige uma nova versão para mudar estrutura ou critérios.';
   end if;
   insert into public.modules(id,course_id,slug,title,description,preview,sort_order,pass_mark,published)
   values(item_id,parent_id,payload->>'slug',title_text,coalesce(payload->>'description',''),coalesce(payload->>'preview',''),position,(payload->>'pass_mark')::numeric,visible)
   on conflict(id) do update set course_id=excluded.course_id,slug=excluded.slug,title=excluded.title,description=excluded.description,preview=excluded.preview,sort_order=excluded.sort_order,pass_mark=excluded.pass_mark,published=excluded.published;
 else
   parent_id := (payload->>'module_id')::uuid;
   if parent_id is null or not exists(select 1 from public.modules where id=parent_id) then raise exception 'Invalid module'; end if;
   if kind='lesson' then select to_jsonb(l) into previous from public.lessons l where id=item_id for update;
   else select to_jsonb(a) into previous from public.activities a where id=item_id for update; end if;
   select exists(select 1 from public.student_module_progress where module_id in (parent_id,(previous->>'module_id')::uuid)) or
     exists(select 1 from public.submissions s join public.activities a on a.id=s.activity_id where a.module_id in (parent_id,(previous->>'module_id')::uuid)) into has_progress;
   if has_progress and (previous is null or (previous->>'module_id')::uuid is distinct from parent_id or (previous->>'required')::boolean is distinct from required_item or (previous->>'published')::boolean is distinct from visible or (kind='activity' and previous->>'activity_type' is distinct from payload->>'activity_type')) then
     raise exception 'O módulo em uso exige uma nova versão para mudar atividades ou critérios.';
   end if;
   if kind='lesson' then
     if length(coalesce(payload->>'body_md',''))>200000 or (visible and length(trim(coalesce(payload->>'body_md','')))<100) then raise exception 'Published lesson needs content'; end if;
     if (payload->>'estimated_minutes')::int is null or (payload->>'estimated_minutes')::int not between 1 and 1440 then raise exception 'Invalid duration'; end if;
     if has_progress and (previous->>'estimated_minutes')::int is distinct from (payload->>'estimated_minutes')::int then raise exception 'Duration is frozen for modules in use'; end if;
     insert into public.lessons(id,module_id,title,body_md,sort_order,estimated_minutes,required,published)
     values(item_id,parent_id,title_text,coalesce(payload->>'body_md',''),position,(payload->>'estimated_minutes')::int,required_item,visible)
     on conflict(id) do update set module_id=excluded.module_id,title=excluded.title,body_md=excluded.body_md,sort_order=excluded.sort_order,estimated_minutes=excluded.estimated_minutes,required=excluded.required,published=excluded.published;
   else
     if payload->>'activity_type' is null or payload->>'activity_type' not in ('exercise','quiz','project','exam') or (payload->>'max_attempts')::int is null or (payload->>'max_attempts')::int not between 1 and 100 then raise exception 'Invalid activity'; end if;
     if length(coalesce(payload->>'instructions_md',''))>100000 or (visible and length(trim(coalesce(payload->>'instructions_md','')))<30) then raise exception 'Published activity needs instructions'; end if;
     if has_progress and (previous->>'max_attempts')::int is distinct from (payload->>'max_attempts')::int then raise exception 'Use extra attempts for individual recovery'; end if;
     insert into public.activities(id,module_id,title,instructions_md,activity_type,sort_order,max_attempts,required,published)
     values(item_id,parent_id,title_text,coalesce(payload->>'instructions_md',''),payload->>'activity_type',position,(payload->>'max_attempts')::int,required_item,visible)
     on conflict(id) do update set module_id=excluded.module_id,title=excluded.title,instructions_md=excluded.instructions_md,activity_type=excluded.activity_type,sort_order=excluded.sort_order,max_attempts=excluded.max_attempts,required=excluded.required,published=excluded.published;
   end if;
 end if;
 insert into public.audit_log(actor_id,action,target_type,target_id,details)
 values(auth.uid(),case when previous is null then 'content.created' else 'content.updated' end,kind,item_id::text,jsonb_build_object('before',previous,'after',payload));
 return item_id;
end $$;
revoke all on function public.save_content(text,jsonb) from public,anon;
grant execute on function public.save_content(text,jsonb) to authenticated,service_role;
