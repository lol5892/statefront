import fs from 'node:fs';import {execFileSync} from 'node:child_process';
fs.mkdirSync('dist',{recursive:true});
if(fs.existsSync('dist/map.json'))fs.unlinkSync('dist/map.json');
execFileSync(process.execPath,['package/lib/tsc.js','-p','tsconfig.json'],{stdio:'inherit'});
for(const f of fs.readdirSync('public'))fs.copyFileSync('public/'+f,'dist/'+f);
console.log('Statefront v3 production: 30 local operations, 6–10 sectors each');
