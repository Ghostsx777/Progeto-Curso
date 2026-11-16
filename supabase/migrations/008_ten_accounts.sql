-- Dez contas no total, incluindo o proprietário e contas bloqueadas.
-- O bloqueio transacional serializa admissões simultâneas sem consumir convites rejeitados.
create function public.enforce_account_capacity() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(918235);
 if (select count(*) from public.profiles)>=10 then
   raise exception 'A turma atingiu o limite de 10 contas, incluindo o proprietário.';
 end if;
 return new;
end $$;
revoke all on function public.enforce_account_capacity() from public,anon,authenticated;
create trigger enforce_account_capacity before insert on auth.users
 for each row execute function public.enforce_account_capacity();
