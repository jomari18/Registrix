import {readFile,readdir,writeFile} from 'node:fs/promises';
// CLI run-code consumes a function expression, not a semicolon-terminated program.
for(const name of (await readdir('tests/browser')).filter(n=>n.endsWith('.js'))){const file='tests/browser/'+name;await writeFile(file,(await readFile(file,'utf8')).replace(/;\s*$/,'')+'\n');}
