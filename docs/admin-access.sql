-- Dedicated Registrix project only. Run once after registering and verifying your own account.
do $$
declare approved_email text := 'REPLACE_WITH_CONFIRMED_ADMIN_EMAIL';target uuid;
begin
 if approved_email='REPLACE_WITH_CONFIRMED_ADMIN_EMAIL' or approved_email not like '%@%' then raise exception 'Set your confirmed administrator email first';end if;
 select id into target from auth.users where lower(email)=lower(trim(approved_email)) and email_confirmed_at is not null;
 if target is null then raise exception 'Confirmed account not found in this project';end if;
 insert into registrix_private.memberships(user_id,role,state)values(target,'administrator','active')on conflict(user_id)do update set role='administrator',state='active',version=memberships.version+1,updated_at=now();
end$$;
