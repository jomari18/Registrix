import {readFile,writeFile} from 'node:fs/promises';
const api=await readFile('supabase/migrations/20261012154620_registrix_apis.sql','utf8');
let read=api.slice(api.indexOf('create function registrix_private.read_api'),api.indexOf('create function registrix_private.mutate_api'));
read=read.replace('create function','create or replace function').replace('when \'list_catalog\' then','when \'list_catalog\' then\n  if show_archived and role=\'teacher\' then return registrix_private.fail(\'FORBIDDEN\',\'Catalog archival requires record management access.\');end if;').replace('where s.active and','where s.active=(not show_archived) and');
let mutate=api.slice(api.indexOf('create function registrix_private.mutate_api'),api.indexOf('create function registrix_private.find_action'));
mutate=mutate.replace('create function','create or replace function').replace("when 'save_subject' then",`when 'save_subject' then
  if jsonb_typeof(payload->'units') is distinct from 'number' or round((payload->>'units')::numeric,1)<>(payload->>'units')::numeric then return registrix_private.fail('INVALID_REQUEST','Units require a numeric value with up to one decimal.');end if;`);
await writeFile('supabase/migrations/20261012161827_registrix_catalog_hardening.sql',`alter table public.subjects add constraint subjects_label_lengths check(length(trim(code)) between 1 and 80 and length(trim(description)) between 1 and 300);\n${read}\n${mutate}\n`);
