set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$declare r jsonb;class_id uuid;begin
 select c.id into class_id from public.classes c where section='B';
 r=public.set_teacher_assignment(jsonb_build_object('actionId',gen_random_uuid(),'expectedVersion',null,'payload',jsonb_build_object('user_id','10000000-0000-4000-8000-000000000003','class_id',class_id,'active',true)));if r->>'ok'<>'true' then raise exception 'Assign failed %',r;end if;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$declare r jsonb;begin
 if (select count(*)from public.students)<>1 then raise exception 'Assigned teacher direct roster is incorrect';end if;
 if public.get_student('{"id":"ffffffff-ffff-4fff-8fff-ffffffffffff"}')->>'code'<>'NOT_FOUND' then raise exception 'Guessed detail leak';end if;
 r=public.save_grades(jsonb_build_object('actionId',gen_random_uuid(),'expectedVersion',1,'payload',jsonb_build_object('enrollment_id',(select e.id from public.enrollments e join public.classes c on c.id=e.class_id where c.section='B'),'scores','{}'::jsonb)));if r->>'ok'<>'true' then raise exception 'Assigned teacher cannot save %',r;end if;
end$$;
reset role;
update registrix_private.assignments set active=false where user_id='10000000-0000-4000-8000-000000000003';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$begin if public.list_classes('{}')->'data'->>'total'<>'0' then raise exception 'Removed assignment still visible';end if;end$$;
reset role;
update registrix_private.memberships set state='revoked' where user_id='10000000-0000-4000-8000-000000000003';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
do $$begin if public.list_students('{}')->>'code'<>'FORBIDDEN' then raise exception 'Revoked access remains';end if;end$$;
reset role;
set role anon;
do $$begin
 begin perform public.list_students('{}');raise exception 'Anon RPC access';exception when insufficient_privilege then null;end;
 begin perform 1 from public.students;raise exception 'Anon records access';exception when insufficient_privilege then null;end;
end$$;
reset role;
