do $$declare n integer;begin
 select count(*) into n from pg_class c join pg_namespace s on c.relnamespace=s.oid where s.nspname in ('public','registrix_private') and c.relkind='r' and c.relrowsecurity;
 if n<>10 then raise exception 'Expected RLS on all ten tables, got %',n;end if;
 insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values ('10000000-0000-4000-8000-000000000004','pending@example.test',now(),'{"display_name":"Demo pending","username":"pending_user","role":"administrator"}');
 if not exists(select 1 from registrix_private.memberships where user_id='10000000-0000-4000-8000-000000000004' and state='pending' and role is null)then raise exception 'Metadata escalation';end if;
 insert into public.students(student_no,surname,first_name,gender) values('demo-001','Demo','Alex','other'),('DEMO-002','Demo','Alex','other');
 begin insert into public.students(student_no,surname,first_name,gender)values(' DEMO-001 ','Other','Person','other');raise exception 'Duplicate normalized number accepted';exception when unique_violation then null;end;
 insert into public.subjects(id,code,description,units,course,year_level,semester) values('20000000-0000-4000-8000-000000000001','TEST','Synthetic subject',3,'BSCS',1,'1st');
 insert into public.classes(id,subject_id,course,year_level,section,semester,school_year)values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','BSCS',1,'A','1st','2030-2031');
 begin insert into public.classes(subject_id,course,year_level,section,semester,school_year)values('20000000-0000-4000-8000-000000000001','BSCS',1,'A','1st','2030-2032');raise exception 'Nonconsecutive year accepted';exception when check_violation then null;end;
 insert into public.enrollments(student_id,class_id) select id,'30000000-0000-4000-8000-000000000001' from public.students;
 begin insert into public.enrollments(student_id,class_id)select id,'30000000-0000-4000-8000-000000000001' from public.students limit 1;raise exception 'Duplicate enrollment accepted';exception when unique_violation then null;end;
end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
do $$begin
 if (public.get_my_access()->'data'->>'state')<>'pending' then raise exception 'Wrong access state';end if;
 if exists(select 1 from public.students) then raise exception 'Pending data leak';end if;
end$$;
reset role;
