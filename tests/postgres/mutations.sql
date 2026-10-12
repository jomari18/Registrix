set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$declare r jsonb;replay jsonb;id uuid;request jsonb;begin
 request='{"actionId":"90000000-0000-4000-8000-000000000010","expectedVersion":null,"payload":{"student_no":"FIX-001","surname":"Synthetic","first_name":"Alex","gender":"other"}}';
 r=public.save_student(request);if r->>'ok' is distinct from 'true' then raise exception 'Create failed %',r;end if;id=(r->'data'->>'id')::uuid;
 replay=public.save_student(request);if replay<>r then raise exception 'Replay changed';end if;
 replay=public.save_student(jsonb_set(request,'{payload,first_name}','"Changed"'));if replay->>'code' is distinct from 'ACTION_CONFLICT' then raise exception 'Changed payload accepted';end if;
 replay=public.save_student(jsonb_build_object('actionId','90000000-0000-4000-8000-000000000011','expectedVersion',0,'payload',(request->'payload')||jsonb_build_object('id',id)));if replay->>'code' is distinct from 'VERSION_CONFLICT' then raise exception 'Stale accepted %',replay;end if;
 replay=public.review_staff_access('{"actionId":"90000000-0000-4000-8000-000000000012","expectedVersion":1,"payload":{"user_id":"10000000-0000-4000-8000-000000000001","state":"revoked","role":"administrator"}}');if replay->>'code' is distinct from 'LAST_ADMIN' then raise exception 'Final admin removed %',replay;end if;
end$$;
reset role;
do $$begin if (select count(*) from registrix_private.audit where action='save_student')<>1 then raise exception 'Duplicate audit';end if;end$$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$begin if public.find_my_action('{"actionId":"90000000-0000-4000-8000-000000000010"}')->>'code' is distinct from 'NOT_FOUND' then raise exception 'Cross actor receipt';end if;end$$;
reset role;
