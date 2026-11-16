-- Publicação explícita do catálogo: publicar módulos não matricula ninguém automaticamente.
create function public.set_course_publication(cid uuid,visible boolean) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() or visible is null then raise exception 'Forbidden'; end if;
 if not exists(select 1 from public.courses where id=cid and not archived) then raise exception 'Formação indisponível'; end if;
 if visible and not exists(select 1 from public.modules m join public.lessons l on l.module_id=m.id where m.course_id=cid and m.published and l.published) then raise exception 'Publique pelo menos um módulo e uma aula antes de abrir matrículas.'; end if;
 update public.courses set published=visible where id=cid;
 insert into public.audit_log(actor_id,action,target_type,target_id,details) values(auth.uid(),'course.publication','course',cid::text,jsonb_build_object('published',visible));
end $$;
revoke all on function public.set_course_publication(uuid,boolean) from public,anon;
grant execute on function public.set_course_publication(uuid,boolean) to authenticated,service_role;
