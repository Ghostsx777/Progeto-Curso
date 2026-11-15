-- Uso único e prazo são condições independentes. Um token nunca é reativado.
alter table public.invites add constraint invite_consumption_pair
 check ((used_at is null) = (used_by is null));

create function public.protect_invite_lifecycle() returns trigger
language plpgsql set search_path=public as $$
begin
 if new.token_hash is distinct from old.token_hash or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by or new.expires_at is distinct from old.expires_at
    or new.email is distinct from old.email then
   raise exception 'Invite identity and deadline are immutable; create a new invitation';
 end if;
 if old.used_at is not null and (new.used_at is distinct from old.used_at or new.used_by is distinct from old.used_by or new.revoked_at is distinct from old.revoked_at) then
   raise exception 'Consumed invitation is permanently invalid';
 end if;
 if old.revoked_at is not null and (new.revoked_at is distinct from old.revoked_at or new.used_at is distinct from old.used_at or new.used_by is distinct from old.used_by) then
   raise exception 'Revoked invitation is permanently invalid';
 end if;
 return new;
end $$;
create trigger protect_invite_lifecycle before update on public.invites
 for each row execute function public.protect_invite_lifecycle();

create function public.create_invite_at(hash text,deadline timestamptz,bound_email text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare iid uuid;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if hash is null or hash !~ '^[0-9a-f]{64}$' or deadline is null or not isfinite(deadline)
    or deadline<=clock_timestamp() then raise exception 'Invalid invitation or expiration'; end if;
 if bound_email is not null and (length(trim(bound_email))>254 or trim(bound_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Invalid email'; end if;
 insert into public.invites(token_hash,created_by,expires_at,email)
 values(hash,auth.uid(),deadline,lower(trim(bound_email))) returning id into iid;
 insert into public.audit_log(actor_id,action,target_type,target_id,details)
 values(auth.uid(),'invite.created','invite',iid::text,jsonb_build_object('expires_at',deadline));
 return iid;
end $$;

-- Mantém compatibilidade com a assinatura da migração anterior.
create or replace function public.create_invite(hash text,valid_days int,bound_email text default null)
returns uuid language plpgsql security definer set search_path=public as $$
begin
 if valid_days is null or valid_days not between 1 and 30 then raise exception 'Invalid duration'; end if;
 return public.create_invite_at(hash,clock_timestamp()+make_interval(days=>valid_days),nullif(trim(bound_email),''));
end $$;

create or replace function public.on_private_signup() returns trigger
language plpgsql security definer set search_path=public as $$
declare invite public.invites; new_role public.app_role := 'student'; accepted_at timestamptz;
begin
 if new.raw_app_meta_data->>'bootstrap_owner'='true' then
   perform pg_advisory_xact_lock(918235);
   if exists(select 1 from public.profiles where role='admin') then raise exception 'Owner already exists'; end if;
   new_role := 'admin';
 else
   select * into invite from public.invites where token_hash=new.raw_app_meta_data->>'invite_hash' for update;
   -- clock_timestamp é avaliado DEPOIS de esperar o lock. now() ficaria preso ao início da transação.
   accepted_at := clock_timestamp();
   if invite.id is null or invite.used_at is not null or invite.revoked_at is not null
      or invite.expires_at<=accepted_at or new.email is null
      or (invite.email is not null and lower(invite.email)<>lower(new.email)) then raise exception 'Invalid invitation'; end if;
 end if;
 insert into public.profiles(id,full_name,email,role)
 values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Aluno'),120),new.email,new_role);
 if new_role='student' then
   update public.invites set used_at=accepted_at,used_by=new.id where id=invite.id;
   insert into public.audit_log(actor_id,action,target_type,target_id,details)
   values(new.id,'invite.accepted','invite',invite.id::text,jsonb_build_object('used_at',accepted_at));
 end if;
 return new;
end $$;

create or replace function public.revoke_invite(iid uuid) returns void
language plpgsql security definer set search_path=public as $$
declare invite public.invites; revoked timestamptz;
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 select * into invite from public.invites where id=iid for update;
 if invite.id is null or invite.used_at is not null then raise exception 'Invitation unavailable'; end if;
 if invite.revoked_at is not null then return; end if;
 revoked := clock_timestamp();
 update public.invites set revoked_at=revoked where id=iid;
 insert into public.audit_log(actor_id,action,target_type,target_id,details)
 values(auth.uid(),'invite.revoked','invite',iid::text,jsonb_build_object('revoked_at',revoked));
end $$;

revoke all on function public.protect_invite_lifecycle(),public.create_invite_at(text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.create_invite_at(text,timestamptz,text) to authenticated,service_role;
