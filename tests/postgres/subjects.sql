set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$declare r jsonb;begin
 r=public.set_subject_archived('{"actionId":"90000000-0000-4000-8000-000000000090","expectedVersion":1,"payload":{"id":"20000000-0000-4000-8000-000000000001","archived":true}}');if r->>'code'<>'ACTIVE_ENROLLMENTS' then raise exception 'Active subject archive accepted %',r;end if;
 r=public.save_subject('{"actionId":"90000000-0000-4000-8000-000000000091","expectedVersion":null,"payload":{"code":"DEMO-NEW","description":"Synthetic curriculum","units":3,"course":"BSCS","year_level":1,"semester":"1st"}}');if r->>'ok'<>'true' then raise exception 'Catalog save failed %',r;end if;
 r=public.set_subject_archived(jsonb_build_object('actionId',gen_random_uuid(),'expectedVersion',1,'payload',jsonb_build_object('id',r->'data'->>'id','archived',true)));if r->>'ok'<>'true' then raise exception 'Unused subject archive failed';end if;
 r=public.list_catalog('{"archived":true,"search":"DEMO-NEW"}');if r->'data'->>'total'<>'1' then raise exception 'Archived catalog cannot be restored %',r;end if;
 r=public.save_subject('{"actionId":"90000000-0000-4000-8000-000000000092","expectedVersion":null,"payload":{"code":"DEMO-PRECISION","description":"Synthetic curriculum","units":3.11,"course":"BSCS","year_level":1,"semester":"1st"}}');if r->>'code'<>'INVALID_REQUEST' then raise exception 'Units silently rounded';end if;
end$$;
reset role;
