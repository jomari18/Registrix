import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
async function walk(root){return(await Promise.all((await readdir(root,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(root,e.name)):[path.join(root,e.name)]))).flat();}
const files=await walk('dist');
for(const f of files){if(/\.mdb$|\.env|\.zip$|\.sql$|\.map$|fixture|bootstrap/i.test(f))throw Error('Unexpected deployable file '+f);const data=await readFile(f,'utf8');if(/sb_secret_[A-Za-z0-9_-]{15,}|REPLACE_WITH_CONFIRMED_ADMIN_EMAIL|RegistrixDemo123!|sb_publishable_synthetic_fixture|127\.0\.0\.1:55445|DEMO-2026-00[12]/.test(data))throw Error('Private/test/setup material in build '+f);for(const token of data.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){try{if(JSON.parse(Buffer.from(token[0].split('.')[1],'base64url').toString()).role==='service_role')throw Error('Privileged JWT in build');}catch(e){if(e.message==='Privileged JWT in build')throw e;}}}
console.log(`${files.length} deployable files checked: no privileged credentials, test records, legacy database, setup SQL or source maps.`);
