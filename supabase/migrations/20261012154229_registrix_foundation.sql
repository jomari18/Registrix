create schema registrix_private;
grant usage on schema public to authenticated;
revoke all on schema registrix_private from public,anon,authenticated;
grant usage on schema registrix_private to authenticated;
create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 120),
 username text not null unique check(username ~ '^[a-z0-9_]{3,32}$'),
 position text not null default '' check(length(position)<=80),
 created_at timestamptz not null default now());
create table registrix_private.memberships(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 role text check(role in ('administrator','registrar','teacher')),
 state text not null default 'pending' check(state in ('pending','active','rejected','revoked')),
 version integer not null default 1,
 approved_by uuid references public.profiles(id),updated_at timestamptz not null default now(),
 check(state<>'active' or role is not null));
create table public.students(
 id uuid primary key default gen_random_uuid(),student_no text not null,
 surname text not null check(length(trim(surname)) between 1 and 100),first_name text not null check(length(trim(first_name)) between 1 and 100),
 middle_initial text not null default '' check(length(middle_initial)<=12),gender text not null check(gender in ('male','female','other')),
 archived boolean not null default false,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(length(student_no) between 1 and 40));
create unique index students_number_unique on public.students(upper(trim(student_no)));
create index students_name_page on public.students(archived,surname,first_name,id);
create table public.subjects(
 id uuid primary key default gen_random_uuid(),code text not null,description text not null,units numeric(4,1) not null check(units>0 and units<=30),
 course text not null check(course in ('BSCS','BSTM','BSHM','BSBA','AB POLSCI','BEED','BSED MATH','BSED ENG')),
 year_level integer not null check(year_level between 1 and 4),semester text not null check(semester in ('1st','2nd','summer')),
 active boolean not null default true,version integer not null default 1,
 unique(code,course,year_level,semester));
create table public.classes(
 id uuid primary key default gen_random_uuid(),subject_id uuid not null references public.subjects(id),
 course text not null,year_level integer not null check(year_level between 1 and 4),section text not null check(section ~ '^[A-J]$'),semester text not null check(semester in ('1st','2nd','summer')),
 school_year text not null check(school_year ~ '^[0-9]{4}-[0-9]{4}$' and substring(school_year,6,4)::integer=substring(school_year,1,4)::integer+1 and substring(school_year,1,4)::integer between 2000 and 2199),
 archived boolean not null default false,version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(subject_id,course,year_level,section,semester,school_year));
create index classes_subject on public.classes(subject_id);
create table public.enrollments(
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),class_id uuid not null references public.classes(id),
 archived boolean not null default false,version integer not null default 1,created_at timestamptz not null default now(),
 unique(student_id,class_id));
create index enrollment_class_scope on public.enrollments(class_id,student_id,id);
create table public.grades(
 enrollment_id uuid primary key references public.enrollments(id),scores jsonb not null default '{}',result jsonb not null,
 version integer not null default 1,updated_by uuid not null references public.profiles(id),updated_at timestamptz not null default now());
create table registrix_private.assignments(
 user_id uuid not null references public.profiles(id) on delete cascade,class_id uuid not null references public.classes(id),active boolean not null default true,
 primary key(user_id,class_id));
create index assignment_class on registrix_private.assignments(class_id);
create table registrix_private.receipts(
 actor_id uuid not null references public.profiles(id),action_id uuid not null,request_text text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(actor_id,action_id));
create table registrix_private.audit(
 id bigint generated always as identity primary key,actor_id uuid not null references public.profiles(id),action text not null,entity_id uuid,created_at timestamptz not null default now());
create index audit_actor_time on registrix_private.audit(actor_id,created_at desc);

create function registrix_private.current_role() returns text language sql stable security definer set search_path='' as $$
 select m.role from registrix_private.memberships m join auth.users u on u.id=m.user_id where m.user_id=(select auth.uid()) and m.state='active' and u.email_confirmed_at is not null and u.email is not null
$$;
create function registrix_private.can_manage_records() returns boolean language sql stable security definer set search_path='' as $$select coalesce(registrix_private.current_role() in ('administrator','registrar'),false)$$;
create function registrix_private.can_access_class(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select registrix_private.can_manage_records() or (registrix_private.current_role()='teacher' and exists(select 1 from registrix_private.assignments a where a.user_id=auth.uid() and a.class_id=p_id and a.active))
$$;
create function registrix_private.own_access() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.profiles;m registrix_private.memberships;u auth.users;
begin
 if auth.uid() is null then return jsonb_build_object('ok',false,'code','UNAUTHENTICATED','message','Sign in to continue.');end if;
 select * into p from public.profiles where id=auth.uid();select * into m from registrix_private.memberships where user_id=auth.uid();select * into u from auth.users where id=auth.uid();
 if p.id is null then return jsonb_build_object('ok',false,'code','UNAUTHENTICATED','message','Account unavailable.');end if;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('state',case when u.email_confirmed_at is null then 'unverified' else m.state end,'role',case when u.email_confirmed_at is not null and m.state='active' then m.role else null end,'profile',to_jsonb(p)));
end$$;
create function public.get_my_access() returns jsonb language sql security invoker set search_path='' as $$select registrix_private.own_access()$$;
create function registrix_private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare name text;handle text;position text;
begin
 name=trim(coalesce(new.raw_user_meta_data->>'display_name','New staff'));handle=lower(trim(coalesce(new.raw_user_meta_data->>'username','staff_'||replace(new.id::text,'-',''))));handle=left(handle,32);position=trim(coalesce(new.raw_user_meta_data->>'position',''));
 if length(name) not between 1 and 120 or handle !~ '^[a-z0-9_]{3,32}$' or length(position)>80 then raise exception 'Invalid profile fields' using errcode='22023';end if;
 insert into public.profiles(id,display_name,username,position)values(new.id,name,handle,position);
 insert into registrix_private.memberships(user_id)values(new.id);
 return new;
end$$;
create trigger registrix_new_user after insert on auth.users for each row execute function registrix_private.create_profile();
create function registrix_private.calculate_grade(p_scores jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare key text;n numeric;total numeric=0;complete boolean=true;average numeric;classification numeric;equivalent text;
begin
 if jsonb_typeof(p_scores)<>'object' then raise exception 'Scores must be an object' using errcode='22023';end if;
 if exists(select 1 from jsonb_object_keys(p_scores) k where k not in ('monthly','firstPrelim','secondPrelim','midterm','preFinal','final'))then raise exception 'Unexpected score field' using errcode='22023';end if;
 foreach key in array array['monthly','firstPrelim','secondPrelim','midterm','preFinal','final'] loop
  if p_scores->key is null or p_scores->key='null'::jsonb then complete=false;continue;end if;
  if jsonb_typeof(p_scores->key)<>'number' then raise exception 'Score must be numeric' using errcode='22023';end if;
  n=(p_scores->>key)::numeric;if n<0 or n>100 or round(n,2)<>n then raise exception 'Score must be 0–100 with at most two decimals' using errcode='22023';end if;total=total+n;
 end loop;
 if not complete then return jsonb_build_object('status','incomplete','generalAverage',null,'classificationAverage',null,'numericalEquivalent',null,'remarks',null);end if;
 average=round(total/6,2);classification=round(total/6,1);
 equivalent=case when classification>=96.5 then '1.00' when classification>=93.5 then '1.25' when classification>=90.5 then '1.50' when classification>=87.5 then '1.75' when classification>=84.5 then '2.00' when classification>=81.5 then '2.25' when classification>=78.5 then '2.50' when classification>=75.5 then '2.75' when classification>=74.5 then '3.00' else '5.00' end;
 return jsonb_build_object('status','complete','generalAverage',to_char(average,'FM990.00'),'classificationAverage',to_char(classification,'FM990.0'),'numericalEquivalent',equivalent,'remarks',case when equivalent='5.00' then 'Failed' else 'Passed' end);
end$$;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.grades enable row level security;
alter table registrix_private.memberships enable row level security;
alter table registrix_private.assignments enable row level security;
alter table registrix_private.receipts enable row level security;
alter table registrix_private.audit enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy catalog_scope on public.subjects for select to authenticated using((select registrix_private.current_role()) is not null);
create policy class_scope on public.classes for select to authenticated using(registrix_private.can_access_class(id));
create policy enrollment_scope on public.enrollments for select to authenticated using(registrix_private.can_access_class(class_id));
create policy student_scope on public.students for select to authenticated using(registrix_private.can_manage_records() or exists(select 1 from public.enrollments e where e.student_id=id and registrix_private.can_access_class(e.class_id)));
create policy grade_scope on public.grades for select to authenticated using(exists(select 1 from public.enrollments e where e.id=enrollment_id and registrix_private.can_access_class(e.class_id)));
revoke all on all tables in schema public from public,anon,authenticated;
revoke all on all tables in schema registrix_private from public,anon,authenticated;
grant select on public.profiles,public.students,public.subjects,public.classes,public.enrollments,public.grades to authenticated;
revoke all on all functions in schema registrix_private from public,anon,authenticated;
revoke all on function public.get_my_access() from public,anon,authenticated;
grant execute on function registrix_private.current_role(),registrix_private.can_manage_records(),registrix_private.can_access_class(uuid),registrix_private.own_access(),public.get_my_access() to authenticated;
