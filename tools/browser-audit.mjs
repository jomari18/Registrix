import {spawn,spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const evidence='outputs/audit';await mkdir(evidence,{recursive:true});
const cli=process.env.PLAYWRIGHT_CLI??path.join(process.env.APPDATA??'', 'npm','playwright-cli.cmd');
if(!path.isAbsolute(cli))throw Error('Set PLAYWRIGHT_CLI to the installed CLI path.');
async function call(args,label){const result=spawnSync(cli,['-s=registrix-audit',...args],{shell:true,encoding:'utf8',timeout:120000});const output=(result.stdout??'')+(result.stderr??'');await writeFile(`${evidence}/${label}.log`,output);if(result.status!==0||output.includes('### Error'))throw Error(`${label} failed: ${output.slice(-2000)}`);return output;}
async function ready(url){for(let n=0;n<60;n++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error('Test server not ready: '+url);}
const children=[];
try{
 for(const port of [5192,55445]){try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response)throw Object.assign(Error(`Port ${port} is occupied; stop the previous audit server first.`),{occupied:true});}catch(e){if(e.occupied)throw e;}}
 const fixture=spawn(process.execPath,['tools/browser-fixture-server.mjs'],{stdio:['ignore','pipe','pipe']});children.push(fixture);let logs='';fixture.stdout.on('data',d=>{logs+=d});fixture.stderr.on('data',d=>{logs+=d});
 await ready('http://127.0.0.1:55445/health');
 const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5192','--strictPort'],{env:{...process.env,VITE_SUPABASE_URL:'http://127.0.0.1:55445',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_fixture'},stdio:['ignore','pipe','pipe']});children.push(vite);vite.stdout.on('data',d=>{logs+=d});vite.stderr.on('data',d=>{logs+=d});await ready('http://127.0.0.1:5192/auth');
 await call(['close'],'previous-session-close');await call(['open','http://127.0.0.1:5192/auth'],'open');
 const scripts=['auth','records','mutation','teacher-records','grading','admin','responsive','resilience'];
 for(const name of scripts){const output=await call(['run-code',`--filename=tests/browser/${name}-audit.js`],name);if(name==='mutation'){const confirm=await call(['run-code','--filename=tests/browser/audit-confirm.js'],'mutation-confirm');if(!confirm.includes('"passed":"mutations"'))throw Error('Recovery audit did not reach its completion marker');}else if(!output.includes('### Ran Playwright code'))throw Error(name+' did not execute');console.log('PASS Playwright CLI '+name);}
 await writeFile(`${evidence}/servers.log`,logs);console.log('All eight Playwright CLI workflow/viewport suites passed using synthetic Auth and real local database RPCs.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{try{await call(['close'],'close');}catch{}for(const child of children)child.kill();}
