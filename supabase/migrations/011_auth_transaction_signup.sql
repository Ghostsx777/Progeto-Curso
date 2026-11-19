-- The Auth admin API can write app_metadata AFTER inserting auth.users.
-- Validate the final row at transaction end, still atomically with account creation.
create or replace function public.on_private_signup() returns trigger
language plpgsql security definer set search_path=public as $$
declare account auth.users; invitation public.invites; new_role public.app_role := 'student'; accepted_at timestamptz;
begin
 select * into account from auth.users where id=new.id;
 if not found then return new; end if;
 perform pg_advisory_xact_lock(918235);
 if (select count(*) from public.profiles)>=10 then raise exception 'Account capacity reached'; end if;
 if account.raw_app_meta_data->>'bootstrap_owner'='true' then
  if exists(select 1 from public.profiles where role='admin') then raise exception 'Owner already exists'; end if;
  new_role := 'admin';
 else
  select * into invitation from public.invites where token_hash=account.raw_app_meta_data->>'invite_hash' for update;
  accepted_at := clock_timestamp();
  if invitation.id is null or invitation.used_at is not null or invitation.revoked_at is not null
    or invitation.expires_at<=accepted_at or account.email is null
    or (invitation.email is not null and lower(invitation.email)<>lower(account.email)) then
   raise exception 'Invalid invitation';
  end if;
 end if;
 insert into public.profiles(id,full_name,email,role)
 values(account.id,left(coalesce(nullif(account.raw_user_meta_data->>'full_name',''),'Aluno'),120),account.email,new_role);
 if new_role='student' then
  update public.invites set used_at=accepted_at,used_by=account.id where id=invitation.id;
  insert into public.audit_log(actor_id,action,target_type,target_id,details)
  values(account.id,'invite.accepted','invite',invitation.id::text,jsonb_build_object('used_at',accepted_at));
 end if;
 return new;
end $$;
drop trigger private_signup on auth.users;
create constraint trigger private_signup after insert on auth.users
 deferrable initially deferred for each row execute function public.on_private_signup();
