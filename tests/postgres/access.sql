insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','admin@example.test',now(),'{"username":"demo_admin"}'),
 ('10000000-0000-4000-8000-000000000002','registrar@example.test',now(),'{"username":"demo_registrar"}'),
 ('10000000-0000-4000-8000-000000000003','teacher@example.test',now(),'{"username":"demo_teacher","role":"administrator"}'),
 ('10000000-0000-4000-8000-000000000005','unverified@example.test',null,'{"username":"demo_unverified"}');
update registrix_private.memberships set role=case user_id::text when '10000000-0000-4000-8000-000000000001' then 'administrator' when '10000000-0000-4000-8000-000000000002' then 'registrar' else 'teacher' end,state='active';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$declare r jsonb;begin
 r=public.save_student('{"actionId":"90000000-0000-4000-8000-000000000001","expectedVersion":null,"payload":{"student_no":"X","surname":"X","first_name":"X","gender":"other"}}');
 if r->>'code' is distinct from 'FORBIDDEN' then raise exception 'Teacher can manage students: %',r;end if;
 r=public.list_students('{}');if r->'data'->>'total' is distinct from '0' then raise exception 'Unassigned teacher leak';end if;
 r=public.list_staff('{}');if r->>'code' is distinct from 'FORBIDDEN' then raise exception 'Teacher staff leak';end if;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$begin if public.review_staff_access('{"actionId":"90000000-0000-4000-8000-000000000002","payload":{}}')->>'code' is distinct from 'FORBIDDEN' then raise exception 'Registrar escalation';end if;end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',false);
do $$begin if public.list_students('{}')->>'code' is distinct from 'FORBIDDEN' then raise exception 'Unverified access';end if;end$$;
reset role;
