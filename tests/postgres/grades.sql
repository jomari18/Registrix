do $$declare r jsonb;begin
 r=registrix_private.calculate_grade('{"monthly":88,"firstPrelim":90,"secondPrelim":91,"midterm":89,"preFinal":92,"final":90}');
 if r->>'generalAverage'<>'90.00' or r->>'numericalEquivalent'<>'1.75' then raise exception 'Wrong computed grade %',r;end if;
 r=registrix_private.calculate_grade('{}');if r->>'status'<>'incomplete' or r->>'generalAverage' is not null then raise exception 'Wrong incomplete result';end if;
 begin perform registrix_private.calculate_grade('{"final":90.001}');raise exception 'Precision accepted';exception when sqlstate '22023' then null;end;
 begin perform registrix_private.calculate_grade('{"final":"90"}');raise exception 'String accepted';exception when sqlstate '22023' then null;end;
end$$;
