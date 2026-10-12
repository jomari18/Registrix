do $$begin
 if has_function_privilege('anon','public.rls_auto_enable()','execute') or has_function_privilege('authenticated','public.rls_auto_enable()','execute') then raise exception 'Provider-created definer helper remains public';end if;
end$$;
