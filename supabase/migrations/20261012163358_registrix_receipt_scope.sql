create or replace function registrix_private.mutate_api(p_name text,p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare role text;action uuid;payload jsonb;expected integer;v_id uuid;result jsonb;s public.students;c public.classes;e public.enrollments;g public.grades;m registrix_private.memberships;a registrix_private.assignments;subject public.subjects;receipt registrix_private.receipts;enabled boolean;allowed text[];
begin
 -- A single application lock makes permission changes, final-admin protection and
 -- versioned writes atomic against one another. No external/table grants can bypass it.
 perform pg_advisory_xact_lock(510012);
 role=registrix_private.current_role();if role is null then return registrix_private.fail('FORBIDDEN','Verified, approved staff access is required.');end if;
 if jsonb_typeof(p_request)<>'object' or jsonb_typeof(p_request->'payload')<>'object' then return registrix_private.fail('INVALID_REQUEST','Review the request fields.');end if;
 action=(p_request->>'actionId')::uuid;if action is null then return registrix_private.fail('INVALID_REQUEST','Action reference is required.');end if;payload=p_request->'payload';expected=(p_request->>'expectedVersion')::integer;
 if p_name in ('review_staff_access','set_teacher_assignment') and role<>'administrator' then return registrix_private.fail('FORBIDDEN','Administrator access is required.');end if;
 if p_name not in ('save_grades','review_staff_access','set_teacher_assignment') and role not in ('administrator','registrar') then return registrix_private.fail('FORBIDDEN','Record management access is required.');end if;
 if p_name='save_grades' and not exists(select 1 from public.enrollments en where en.id=(payload->>'enrollment_id')::uuid and registrix_private.can_access_class(en.class_id))then return registrix_private.fail('FORBIDDEN','Class access is no longer available.');end if;
 select * into receipt from registrix_private.receipts where actor_id=auth.uid() and action_id=action;
 if receipt.action_id is not null then
  if receipt.request_text<>jsonb_build_object('operation',p_name,'request',p_request)::text then return registrix_private.fail('ACTION_CONFLICT','This action reference belongs to a different request.');end if;
  return receipt.result;
 end if;
 case p_name
 when 'save_subject' then
  if jsonb_typeof(payload->'units') is distinct from 'number' or round((payload->>'units')::numeric,1)<>(payload->>'units')::numeric then return registrix_private.fail('INVALID_REQUEST','Units require a numeric value with up to one decimal.');end if;
  v_id=(payload->>'id')::uuid;
  if v_id is null then
   if expected is not null then return registrix_private.fail('VERSION_CONFLICT','Reload first.');end if;
   insert into public.subjects(code,description,units,course,year_level,semester)values(trim(payload->>'code'),trim(payload->>'description'),(payload->>'units')::numeric,payload->>'course',(payload->>'year_level')::integer,payload->>'semester')returning * into subject;
  else
   select * into subject from public.subjects where subjects.id=v_id for update;if subject.id is null then return registrix_private.fail('NOT_FOUND','Subject unavailable.');end if;if expected is distinct from subject.version then return registrix_private.fail('VERSION_CONFLICT','Subject changed. Reload first.');end if;
   if exists(select 1 from public.enrollments en join public.classes cl on cl.id=en.class_id where cl.subject_id=v_id)then return registrix_private.fail('HISTORY_PROTECTED','Create a new subject to preserve enrolled curriculum history.');end if;
   update public.subjects set code=trim(payload->>'code'),description=trim(payload->>'description'),units=(payload->>'units')::numeric,course=payload->>'course',year_level=(payload->>'year_level')::integer,semester=payload->>'semester',version=version+1 where subjects.id=v_id returning * into subject;
  end if;v_id=subject.id;result=to_jsonb(subject);
 when 'set_subject_archived' then
  v_id=(payload->>'id')::uuid;enabled=(payload->>'archived')::boolean;if enabled is null then return registrix_private.fail('INVALID_REQUEST','Archive selection is required.');end if;
  select * into subject from public.subjects where subjects.id=v_id for update;if subject.id is null then return registrix_private.fail('NOT_FOUND','Subject unavailable.');end if;if expected is distinct from subject.version then return registrix_private.fail('VERSION_CONFLICT','Subject changed. Reload first.');end if;
  if enabled and exists(select 1 from public.classes cl join public.enrollments en on en.class_id=cl.id join public.students st on st.id=en.student_id where cl.subject_id=v_id and not cl.archived and not en.archived and not st.archived)then return registrix_private.fail('ACTIVE_ENROLLMENTS','Archive active enrollments before archiving this subject.');end if;
  update public.subjects set active=not enabled,version=version+1 where subjects.id=v_id returning * into subject;result=to_jsonb(subject);
 when 'save_student' then
  allowed=array['id','student_no','surname','first_name','middle_initial','gender'];
  if exists(select 1 from jsonb_object_keys(payload) k where not(k=any(allowed)))then return registrix_private.fail('INVALID_REQUEST','Unexpected student field.');end if;
  v_id=(payload->>'id')::uuid;
  if v_id is null then
   if expected is not null then return registrix_private.fail('VERSION_CONFLICT','Reload before creating this record.');end if;
   insert into public.students(student_no,surname,first_name,middle_initial,gender)values(upper(trim(payload->>'student_no')),trim(payload->>'surname'),trim(payload->>'first_name'),trim(coalesce(payload->>'middle_initial','')),payload->>'gender')returning * into s;
  else
   select * into s from public.students where students.id=v_id for update;
   if s.id is null then return registrix_private.fail('NOT_FOUND','Student unavailable.');end if;
   if expected is distinct from s.version then return registrix_private.fail('VERSION_CONFLICT','This student changed. Reload and review before saving.');end if;
   update public.students set student_no=upper(trim(payload->>'student_no')),surname=trim(payload->>'surname'),first_name=trim(payload->>'first_name'),middle_initial=trim(coalesce(payload->>'middle_initial','')),gender=payload->>'gender',version=version+1,updated_at=now()where students.id=v_id returning * into s;
  end if;v_id=s.id;result=to_jsonb(s);
 when 'set_student_archived' then
  v_id=(payload->>'id')::uuid;enabled=(payload->>'archived')::boolean;if enabled is null then return registrix_private.fail('INVALID_REQUEST','Archive selection is required.');end if;
  select * into s from public.students where students.id=v_id for update;if s.id is null then return registrix_private.fail('NOT_FOUND','Student unavailable.');end if;if expected is distinct from s.version then return registrix_private.fail('VERSION_CONFLICT','Student changed. Reload first.');end if;
  update public.students set archived=enabled,version=version+1,updated_at=now()where students.id=v_id returning * into s;result=to_jsonb(s);
 when 'save_class' then
  v_id=(payload->>'id')::uuid;
  select * into subject from public.subjects where subjects.id=(payload->>'subject_id')::uuid and active;
  if subject.id is null or subject.course is distinct from payload->>'course' or subject.year_level is distinct from (payload->>'year_level')::integer or subject.semester is distinct from payload->>'semester' then return registrix_private.fail('INVALID_REQUEST','Select a subject matching the course, year and semester.');end if;
  if v_id is null then
   if expected is not null then return registrix_private.fail('VERSION_CONFLICT','Reload before creating this record.');end if;
   insert into public.classes(subject_id,course,year_level,section,semester,school_year)values(subject.id,subject.course,subject.year_level,upper(trim(payload->>'section')),subject.semester,payload->>'school_year')returning * into c;
  else
   select * into c from public.classes where classes.id=v_id for update;if c.id is null then return registrix_private.fail('NOT_FOUND','Class unavailable.');end if;if expected is distinct from c.version then return registrix_private.fail('VERSION_CONFLICT','Class changed. Reload first.');end if;
   if exists(select 1 from public.enrollments where class_id=v_id)and (c.subject_id<>subject.id or c.section is distinct from upper(trim(payload->>'section'))or c.school_year is distinct from payload->>'school_year')then return registrix_private.fail('HISTORY_PROTECTED','Create a new class to change the academic group after enrollment.');end if;
   update public.classes set subject_id=subject.id,course=subject.course,year_level=subject.year_level,section=upper(trim(payload->>'section')),semester=subject.semester,school_year=payload->>'school_year',version=version+1,updated_at=now()where classes.id=v_id returning * into c;
  end if;v_id=c.id;result=registrix_private.class_json(v_id);
 when 'set_class_archived' then
  v_id=(payload->>'id')::uuid;enabled=(payload->>'archived')::boolean;if enabled is null then return registrix_private.fail('INVALID_REQUEST','Archive selection is required.');end if;
  select * into c from public.classes where classes.id=v_id for update;if c.id is null then return registrix_private.fail('NOT_FOUND','Class unavailable.');end if;if expected is distinct from c.version then return registrix_private.fail('VERSION_CONFLICT','Class changed. Reload first.');end if;
  if enabled and exists(select 1 from public.enrollments en join public.students st on st.id=en.student_id where en.class_id=v_id and not en.archived and not st.archived)then return registrix_private.fail('ACTIVE_ENROLLMENTS','Archive active enrollments before archiving the class.');end if;
  update public.classes set archived=enabled,version=version+1,updated_at=now()where classes.id=v_id;result=registrix_private.class_json(v_id);
 when 'save_enrollment' then
  if expected is not null then return registrix_private.fail('VERSION_CONFLICT','This is a new enrollment. Restore an archived enrollment instead.');end if;
  if not exists(select 1 from public.students where students.id=(payload->>'student_id')::uuid and not archived)or not exists(select 1 from public.classes where classes.id=(payload->>'class_id')::uuid and not archived)then return registrix_private.fail('ARCHIVED','Select an active student and class.');end if;
  insert into public.enrollments(student_id,class_id)values((payload->>'student_id')::uuid,(payload->>'class_id')::uuid)returning * into e;v_id=e.id;result=registrix_private.enrollment_json(v_id);
 when 'set_enrollment_archived' then
  v_id=(payload->>'id')::uuid;enabled=(payload->>'archived')::boolean;if enabled is null then return registrix_private.fail('INVALID_REQUEST','Archive selection is required.');end if;
  select * into e from public.enrollments where enrollments.id=v_id for update;if e.id is null then return registrix_private.fail('NOT_FOUND','Enrollment unavailable.');end if;if expected is distinct from e.version then return registrix_private.fail('VERSION_CONFLICT','Enrollment changed. Reload first.');end if;
  if not enabled and (exists(select 1 from public.students where students.id=e.student_id and archived)or exists(select 1 from public.classes where classes.id=e.class_id and archived))then return registrix_private.fail('ARCHIVED','Restore the student and class first.');end if;
  update public.enrollments set archived=enabled,version=version+1 where enrollments.id=v_id;result=registrix_private.enrollment_json(v_id);
 when 'save_grades' then
  if exists(select 1 from jsonb_object_keys(payload)k where k not in ('enrollment_id','scores'))then return registrix_private.fail('INVALID_REQUEST','Only six score inputs can be saved.');end if;
  v_id=(payload->>'enrollment_id')::uuid;select * into e from public.enrollments where enrollments.id=v_id for update;
  if e.id is null or not coalesce(registrix_private.can_access_class(e.class_id),false)then return registrix_private.fail('FORBIDDEN','Class access is no longer available.');end if;
  if e.archived or exists(select 1 from public.students where students.id=e.student_id and archived)or exists(select 1 from public.classes where classes.id=e.class_id and archived)then return registrix_private.fail('ARCHIVED','Archived enrollment grades are read-only.');end if;
  select * into g from public.grades where enrollment_id=v_id for update;
  if expected is distinct from g.version then return registrix_private.fail('VERSION_CONFLICT','Grades changed. Reload and review your draft before saving.');end if;
  result=registrix_private.calculate_grade(payload->'scores');
  insert into public.grades(enrollment_id,scores,result,updated_by)values(v_id,payload->'scores',result,auth.uid())on conflict(enrollment_id)do update set scores=excluded.scores,result=excluded.result,version=grades.version+1,updated_by=auth.uid(),updated_at=now()returning * into g;result=to_jsonb(g);
 when 'review_staff_access' then
  v_id=(payload->>'user_id')::uuid;select * into m from registrix_private.memberships where user_id=v_id for update;
  if m.user_id is null then return registrix_private.fail('NOT_FOUND','Staff account unavailable.');end if;if expected is distinct from m.version then return registrix_private.fail('VERSION_CONFLICT','Access changed. Reload first.');end if;
  if payload->>'state' not in ('active','rejected','revoked')or payload->>'role' not in ('administrator','registrar','teacher') then return registrix_private.fail('INVALID_REQUEST','Select an approved role and access state.');end if;
  if payload->>'state'='active' and not exists(select 1 from auth.users where users.id=v_id and email_confirmed_at is not null)then return registrix_private.fail('UNVERIFIED','The staff member must verify their email first.');end if;
  if m.state='active' and m.role='administrator' and (payload->>'state'<>'active' or payload->>'role'<>'administrator') and (select count(*)from registrix_private.memberships where state='active' and memberships.role='administrator')<=1 then return registrix_private.fail('LAST_ADMIN','Keep at least one active administrator.');end if;
  update registrix_private.memberships set state=payload->>'state',role=payload->>'role',version=version+1,approved_by=auth.uid(),updated_at=now()where user_id=v_id returning * into m;result=to_jsonb(m);
 when 'set_teacher_assignment' then
  v_id=(payload->>'class_id')::uuid;enabled=(payload->>'active')::boolean;if enabled is null then return registrix_private.fail('INVALID_REQUEST','Choose assignment status.');end if;
  if not exists(select 1 from public.classes where classes.id=v_id)or not exists(select 1 from registrix_private.memberships where user_id=(payload->>'user_id')::uuid and state='active' and memberships.role='teacher') then return registrix_private.fail('INVALID_REQUEST','Select an active teacher and class.');end if;
  select * into a from registrix_private.assignments where class_id=v_id and user_id=(payload->>'user_id')::uuid for update;if expected is distinct from a.version then return registrix_private.fail('VERSION_CONFLICT','Assignment changed. Reload first.');end if;
  insert into registrix_private.assignments(user_id,class_id,active)values((payload->>'user_id')::uuid,v_id,enabled)on conflict(user_id,class_id)do update set active=excluded.active,version=assignments.version+1 returning * into a;result=to_jsonb(a);
 else return registrix_private.fail('INVALID_REQUEST','Unknown operation.');end case;
 result=registrix_private.ok(result);
 insert into registrix_private.audit(actor_id,action,entity_id)values(auth.uid(),p_name,v_id);
 insert into registrix_private.receipts(actor_id,action_id,request_text,result)values(auth.uid(),action,jsonb_build_object('operation',p_name,'request',p_request)::text,result);
 return result;
exception
 when unique_violation then return registrix_private.fail('DUPLICATE','This number or enrollment already exists. Open the existing record or restore it.');
 when check_violation or not_null_violation or foreign_key_violation or invalid_text_representation or invalid_parameter_value or numeric_value_out_of_range then return registrix_private.fail('INVALID_REQUEST','Review all required fields and score ranges.');
end$$;


create or replace function registrix_private.find_action(p_request jsonb)returns jsonb language plpgsql stable security definer set search_path='' as $$
declare receipt registrix_private.receipts;operation text;role text=registrix_private.current_role();
begin
 if role is null then return registrix_private.fail('FORBIDDEN','Approved staff access is required.');end if;
 select * into receipt from registrix_private.receipts where actor_id=auth.uid() and action_id=(p_request->>'actionId')::uuid;
 if receipt.action_id is null then return registrix_private.fail('NOT_FOUND','No completed action found. Retry the same request.');end if;
 operation=receipt.request_text::jsonb->>'operation';
 if operation='save_grades' then
  if not exists(select 1 from public.enrollments en where en.id=(receipt.request_text::jsonb->'request'->'payload'->>'enrollment_id')::uuid and registrix_private.can_access_class(en.class_id))then return registrix_private.fail('FORBIDDEN','Class access is no longer available.');end if;
 elsif operation in ('review_staff_access','set_teacher_assignment') then
  if role<>'administrator' then return registrix_private.fail('FORBIDDEN','Administrator access is required.');end if;
 elsif not registrix_private.can_manage_records() then return registrix_private.fail('FORBIDDEN','Record management access is required.');end if;
 return receipt.result;
exception when invalid_text_representation then return registrix_private.fail('INVALID_REQUEST','Invalid action reference.');end$$;
