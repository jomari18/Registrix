import {readFile,writeFile} from 'node:fs/promises';
const entries=JSON.parse(await readFile('data/catalog.json','utf8'));
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
await writeFile('supabase/seed.sql','-- Source academic labels only; no students or staff accounts.\n'+entries.map(e=>`insert into public.subjects(code,description,units,course,year_level,semester) values(${[quote(e.code),quote(e.description),e.units,quote(e.course),e.yearLevel,quote(e.semester)].join(',')}) on conflict(code,course,year_level,semester) do nothing;`).join('\n')+'\n');
