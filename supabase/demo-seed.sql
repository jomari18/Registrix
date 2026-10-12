-- OPTIONAL, FICTIONAL demonstration records. Not part of production setup.
-- Run only if you want explicitly labeled demo students in your dedicated project.
insert into public.students(student_no,surname,first_name,gender) values
 ('DEMO-2026-001','Demo Santos','Alex','other'),
 ('DEMO-2026-002','Demo Reyes','Jamie','other')on conflict do nothing;
insert into public.classes(subject_id,course,year_level,section,semester,school_year)
select id,course,year_level,'A',semester,'2026-2027' from public.subjects where code='(BSCS)CC101' and year_level=1 and semester='1st' on conflict do nothing;
insert into public.enrollments(student_id,class_id)
select st.id,cl.id from public.students st cross join public.classes cl join public.subjects su on su.id=cl.subject_id
where st.student_no in ('DEMO-2026-001','DEMO-2026-002')and cl.school_year='2026-2027'and cl.section='A'and su.code='(BSCS)CC101' on conflict do nothing;
