-- Auth runs under supabase_auth_admin, not the SQL migration owner.
-- Grant only the signup triggers; client roles remain unable to call them.
do $$
begin
 if exists(select 1 from pg_roles where rolname='supabase_auth_admin') then
  grant usage on schema public to supabase_auth_admin;
  grant execute on function public.on_private_signup(),public.enforce_account_capacity()
    to supabase_auth_admin;
 end if;
end $$;
