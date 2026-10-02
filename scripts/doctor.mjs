#!/usr/bin/env node
/** Capability checks, not certification. `ok` means the requested profile passed. */
import {existsSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir,homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {paths,findPack,displayPath} from '../lib/paths.mjs';
import {agents,agentFor,directoryFor} from '../lib/agents.mjs';
import {validatePayload} from '../lib/installations.mjs';
import {resolvePlaywright,probeBrowser} from '../lib/browser-runtime.mjs';
const argv=process.argv.slice(2), has=k=>argv.includes('--'+k);
const flag=(k,d=null)=>{const i=argv.indexOf('--'+k);return i>=0&&argv[i+1]&&!argv[i+1].startsWith('--')?argv[i+1]:d;};
const profile=flag('profile','core'), filter=flag('ai',flag('agent'));
if(!['core','browser','full'].includes(profile) || (filter&&!agentFor(filter))) {
  console.error('Invalid profile or agent. Use --profile core|browser|full and an id from designer-install-agent --list.');process.exit(2);
}
if(has('where')) {
  console.log('Package: '+displayPath(paths.packageRoot)+'\nSkill: '+displayPath(join(paths.packageRoot,'SKILL.md'))+'\nState: '+displayPath(paths.stateRoot));
  console.log('Read '+displayPath(join(paths.packageRoot,'SKILL.md'))+' and follow it for this task.');process.exit(0);
}
const sandbox=mkdtempSync(join(tmpdir(),'designer-doctor-'));
process.on('exit',()=>{rmSync(sandbox,{recursive:true,force:true});});
const results=[], record=(layer,status,label,detail)=>results.push({layer,status,label,detail});
const run=(script,args)=>spawnSync(process.execPath,[join(paths.scripts,script),...args],{cwd:tmpdir(),env:{...process.env,DESIGNER_STATE:sandbox},encoding:'utf8',timeout:60000});
record('runtime',Number(process.versions.node.split('.')[0])>=20?'PASS':'FAIL','Node',process.versions.node);
try {validatePayload(paths.packageRoot);record('installed','PASS','Complete payload','Metadata, scripts, instructions, tests and notices present');}
catch(e) {record('installed','FAIL','Payload',e.message);}
for(const name of ['awesome-design-md','awesome-design-skills','claude-design-skills','frontend-design','uipm-stack']) {
  const dir=join(paths.licenses,'upstream',name);
  record('installed',existsSync(join(dir,'LICENSE'))||existsSync(join(dir,'LICENSE.txt'))?'PASS':'FAIL','Licence '+name,'Retained upstream text required');
}
const integrity=run('build-manifest.mjs',['--check']);
record('installed',integrity.status===0?'PASS':'FAIL','Source integrity',integrity.stdout.trim()||integrity.stderr.trim());
const refs=run('pick-references.mjs',['high-density trading terminal','--json']);
try {
  const r=JSON.parse(refs.stdout);if(refs.status!==0||!r.layerB?.length) throw new Error(refs.stderr||'No references');
  record('executable','PASS','Bundled references',r.layerB.length+' ranked references');
  record('packs',r.layerAStatus.present?'PASS':'PARTIAL','Product intelligence',r.layerAStatus.present?r.layerAStatus.count+' product types':r.layerAStatus.reason);
} catch(e) {record('executable','FAIL','Reference selection',e.message);}
const good=run('design-drift.mjs',[join(paths.packageRoot,'tests/fixtures/drift-ok')]);
const bad=run('design-drift.mjs',[join(paths.packageRoot,'tests/fixtures/drift-bad')]);
record('executable',good.status===0?'PASS':'FAIL','Clean drift fixture',String(good.status));
record('executable',bad.status===1&&['raw-color','radius-drift','spacing-drift','type-drift'].every(r=>bad.stdout.includes(r))?'PASS':'FAIL','Negative control','A crash or missing fixture is not successful detection');
const rec=run('record.mjs',['approve','--project','doctor-probe','--why','sandbox']);
record('executable',rec.status===0&&existsSync(join(sandbox,'evals/approved'))?'PASS':'FAIL','Eval store','Sandboxed outside package');
for(const name of ['ui-ux-pro-max','baoyu-design']) {
  const p=findPack(name);record('packs',p?'PASS':'PARTIAL',name,p?displayPath(p):'Optional external pack absent; read bundled fallback routing');
}
if(profile!=='core') {
  const pw=resolvePlaywright();
  if(!pw) record('browser','PARTIAL','Pinned Playwright','Run designer-setup --profile browser --apply');
  else {
    try {const p=await probeBrowser();record('browser','PASS','Chromium launch','Rendered and captured '+p.bytes+' bytes; '+displayPath(p.library));}
    catch(e) {record('browser','PARTIAL','Chromium launch',e.message.slice(0,350)+'; run designer-setup --profile browser --apply');}
  }
}
for(const a of filter?[agentFor(filter)]:agents) {
  const dirs=[directoryFor(a,'user'),directoryFor(a,'project')].filter(Boolean);
  const present=dirs.find(d=>{
    try {const t=readFileSync(join(d,'designer/SKILL.md'),'utf8');return /^---\r?\n/.test(t)&&/\nname:\s*designer\s*\r?\n/.test(t)&&/\ndescription:\s*\S/.test(t);}
    catch {return false;}
  });
  record('agent-files',present?'PASS':'PARTIAL',a.label,present?'Valid entry file at '+present:'Not placed in checked directories; use installer or bridge');
  record('agent','PARTIAL',a.label+' native discovery','Not exercised by this script. Restart client and invoke the workflow; placement alone is not proof.');
}
const config=join(homedir(),'.pi/agent/mcp.json');let mcp={};
try {mcp=JSON.parse(readFileSync(config,'utf8')).mcpServers??{};} catch {}
for(const name of ['playwright','chrome-devtools','shadcn']) record('mcp','PARTIAL',name,mcp[name]?'Config present; connection and tools must be exercised in the target client':'Not configured here; optional client-owned capability');
const layers=['runtime','installed','executable','packs','browser','agent-files','agent','mcp'];
const worst=l=>{const rows=results.filter(r=>r.layer===l);return !rows.length?'SKIP':rows.some(r=>r.status==='FAIL')?'FAIL':rows.some(r=>r.status==='PARTIAL')?'PARTIAL':'PASS';};
const summary=Object.fromEntries(layers.map(l=>[l,worst(l)]));
const coreOk=['runtime','installed','executable'].every(l=>summary[l]==='PASS');
const browserReady=summary.browser==='PASS';
const profileReady=coreOk&&(profile==='core'||browserReady)&&(profile!=='full'||['packs','agent','mcp'].every(l=>summary[l]==='PASS'));
const report={profile,ok:profileReady,coreOk,browserReady,fullyVerified:layers.every(l=>summary[l]==='PASS'),summary,results};
if(has('json')) console.log(JSON.stringify(report,null,2));
else {
  console.log('Designer — '+profile+' readiness');for(const r of results) console.log(r.status+' '+r.layer+' / '+r.label+': '+r.detail);
  console.log('Core executable: '+coreOk+'; browser ready: '+browserReady+'; requested profile ready: '+profileReady);
  console.log('PARTIAL is unverified, not a successful discovery/connection claim. Full profile requires client-side evidence.');
}
// Let piped stdout drain (macOS pipes can buffer only 8 KiB).
process.exitCode = !coreOk ? 1 : profileReady ? 0 : 2;
