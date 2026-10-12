update registrix_private.memberships set state='active' where user_id='10000000-0000-4000-8000-000000000003';
-- Receipt recovery is a scoped read, not an authorization bypass after assignment removal.
insert into registrix_private.assignments(user_id,class_id,active)
select '10000000-0000-4000-8000-000000000003',id,true from public.classes where section='B'
on conflict(user_id,class_id)do update set active=true;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$declare e uuid;r jsonb;begin
 select en.id into e from public.enrollments en join public.classes cl on cl.id=en.class_id where cl.section='B';
 r=public.save_grades(jsonb_build_object('actionId','90000000-0000-4000-8000-000000000095','expectedVersion',2,'payload',jsonb_build_object('enrollment_id',e,'scores','{}'::jsonb)));if r->>'ok' is distinct from 'true' then raise exception 'Teacher pre-removal save failed %',r;end if;
end$$;
reset role;
update registrix_private.assignments set active=false where user_id='10000000-0000-4000-8000-000000000003';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$begin
 if public.find_my_action('{"actionId":"90000000-0000-4000-8000-000000000095"}')->>'code' is distinct from 'FORBIDDEN' then raise exception 'Receipt bypasses removed assignment';end if;
end$$;
reset role;
