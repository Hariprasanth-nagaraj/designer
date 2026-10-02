#!/usr/bin/env node
/** Regression controls for every reproducible distribution/lifecycle review finding. No network. */
import * as fs from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {paths} from '../lib/paths.mjs';
import {PAYLOAD,manifestOf,receipts} from '../lib/installations.mjs';
const box=fs.mkdtempSync(join(tmpdir(),'designer-parity-tests-'));
const home=join(box,'home with spaces'), state=join(box,'state with spaces');fs.mkdirSync(home);
const env={...process.env,HOME:home,USERPROFILE:home,LOCALAPPDATA:join(home,'local'),DESIGNER_STATE:state,DESIGNER_UIPM:join(home,'missing'),DESIGNER_BAOYU:join(home,'missing')};
const run=(script,args=[],extra={})=>spawnSync(process.execPath,[script,...args],{cwd:box,env,encoding:'utf8',timeout:120000,...extra});
const script=name=>join(paths.scripts,name);
let pass=0,fail=0;
const assert=(c,m)=>{if(!c)throw new Error(m);};
const test=async(name,fn)=>{try {await fn();pass++;console.log('  PASS '+name);}catch(e){fail++;console.log('  FAIL '+name+' — '+e.message);if(process.env.CI)console.error('::error title=Parity test '+name+'::'+e.message.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));}};
const install=(args=[],extra={})=>run(script('install-agent.mjs'),['--ai','pi','--mode','copy',...args],extra);
const copy=join(home,'.pi/agent/skills/designer');
const copyOf=(at)=>{fs.mkdirSync(at,{recursive:true});for(const item of PAYLOAD)if(fs.existsSync(join(paths.packageRoot,item)))fs.cpSync(join(paths.packageRoot,item),join(at,item),{recursive:true});};
try {
 await test('active workflow contains no legacy tool-root commands',()=>{
  for(const rel of ['SKILL.md','references/design-review.md','references/design-grammar.md']) assert(!/\$HOME\/\.design-system|~\/\.design-system/.test(fs.readFileSync(join(paths.packageRoot,rel),'utf8')),rel);
 });
 await test('knowledge router points at actual bundled aesthetic/UX files',()=>{
  const r=JSON.parse(run(script('knowledge.mjs')).stdout);assert(fs.existsSync(r.bundled.aesthetic)&&fs.existsSync(r.bundled.productTypes)&&fs.existsSync(r.bundled.ux),'missing routed source');
  assert(fs.readFileSync(join(paths.references,'capabilities.md'),'utf8').includes('data/frontend-design.md'),'no aesthetic routing');
 });
 await test('bundled product intelligence works with all optional packs absent',()=>{
  const r=JSON.parse(run(script('pick-references.mjs'),['trading dashboard','--json']).stdout);assert(r.layerAStatus.count===192&&r.layerAStatus.source==='bundled'&&r.layerA.length>0,'Layer A missing');
 });
 await test('missing optional overrides do not fall through to private home skills',()=>{
  const r=JSON.parse(run(script('knowledge.mjs')).stdout);assert(Object.values(r.external).every(x=>!x.available),'unexpected pack');
 });
 await test('empty optional overrides never select the current package as baoyu',()=>{
  const r=JSON.parse(run(script('knowledge.mjs'),[],{cwd:paths.packageRoot,env:{...env,DESIGNER_UIPM:'',DESIGNER_BAOYU:''}}).stdout);
  assert(!r.external['baoyu-design'].available,'wrong skill selected');
 });
 await test('no-argument installer gives a read-only plan, not null-agent error',()=>{
  const before=fs.existsSync(state);const r=run(script('install-agent.mjs'));assert(r.status===0,'exit '+r.status);assert(fs.existsSync(state)===before,'state mutation');
 });
 await test('advertised generic print-bridge works without mutation',()=>{
  const r=run(script('install-agent.mjs'),['--agent','generic','--print-bridge']);assert(r.status===0&&r.stdout.includes('SKILL.md'),'bridge broken');assert(!fs.existsSync(state),'bridge wrote state');
 });
 await test('install dry-run leaves state and destinations absent',()=>{
  const r=install();assert(r.status===0&&!fs.existsSync(copy)&&!fs.existsSync(state),'dry run mutated');
 });
 await test('copy includes metadata and ships valid immutable integrity',()=>{
  const r=install(['--apply']);assert(r.status===0,r.stderr);assert(fs.existsSync(join(copy,'package.json'))&&fs.existsSync(join(copy,'dependencies.lock.json')),'metadata omitted');
  assert(run(join(copy,'scripts/build-manifest.mjs'),['--check']).status===0,'copy manifest stale');
 });
 await test('installed copy passes its original complete core suite',()=>{
  const r=run(join(copy,'tests/run-tests.mjs'));assert(r.status===0,r.stdout+' '+r.stderr);
 });
 await test('copied installer works for another target, with a completed receipt',()=>{
  const r=run(join(copy,'scripts/install-agent.mjs'),['--ai','universal','--mode','copy','--apply']);assert(r.status===0,r.stderr);
  const dest=join(home,'.agents/skills/designer');assert(fs.existsSync(join(dest,'package.json')),'partial payload');
  const rows=fs.readdirSync(join(state,'receipts')).map(f=>JSON.parse(fs.readFileSync(join(state,'receipts',f),'utf8')));assert(rows.some(x=>x.destination===dest),'receipt absent');
 });
 await test('copied uninstaller can remove its own registered copy, not its source',()=>{
  const dest=join(home,'.agents/skills/designer');const r=run(join(dest,'scripts/uninstall-agent.mjs'),['--ai','universal','--apply']);
  assert(r.status===0&&!fs.existsSync(dest)&&fs.existsSync(copy),'self-copy uninstall/source protection failed');
 });
 await test('unchanged managed reinstall succeeds',()=>{assert(install(['--apply']).status===0,'unchanged refused');});
 await test('managed user edits block reinstall and remain intact',()=>{
  const file=join(copy,'USER-NOTES.txt');fs.writeFileSync(file,'preserve me');const r=install(['--apply']);assert(r.status===3&&fs.readFileSync(file,'utf8')==='preserve me','edit lost');
  fs.rmSync(file);
 });
 await test('ordinary failed commit restores destination and old receipt',()=>{
  const before=manifestOf(copy), rec=fs.readFileSync(join(state,'receipts',fs.readdirSync(join(state,'receipts')).find(f=>f.startsWith('pi-'))),'utf8');
  const r=install(['--apply'],{env:{...env,DESIGNER_TEST_FAIL_INSTALL_COMMIT:'1'}});
  assert(r.status!==0&&manifestOf(copy).sha256===before.sha256,'destination not restored');
  assert(fs.readFileSync(join(state,'receipts',fs.readdirSync(join(state,'receipts')).find(f=>f.startsWith('pi-'))),'utf8')===rec,'receipt changed');
 });
 await test('edited-copy uninstall retains both copy and ownership receipt',()=>{
  fs.writeFileSync(join(copy,'USER-NOTES.txt'),'preserve');const r=run(script('uninstall-agent.mjs'),['--ai','pi','--apply']);assert(r.status===3&&fs.existsSync(copy),'edit removed');
  assert(fs.readdirSync(join(state,'receipts')).some(f=>f.startsWith('pi-')),'receipt removed');fs.rmSync(join(copy,'USER-NOTES.txt'));
 });
 await test('project and user receipts coexist without collisions',()=>{
  const projects=[join(box,'project-a'),join(box,'project-b')];for(const cwd of projects){fs.mkdirSync(cwd);const r=run(script('install-agent.mjs'),['--ai','claude','--scope','project','--apply'],{cwd});assert(r.status===0,r.stderr);}
  assert(run(script('install-agent.mjs'),['--ai','claude','--apply']).status===0,'user install');
  const rows=fs.readdirSync(join(state,'receipts')).filter(f=>f.startsWith('claude-'));assert(rows.length===3,'receipts overwritten');
  assert(run(script('uninstall-agent.mjs'),['--ai','claude','--apply']).status!==0,'ambiguous removal allowed');
  assert(run(script('uninstall-agent.mjs'),['--ai','claude','--scope','project','--apply'],{cwd:projects[0]}).status===0,'project uninstall failed');assert(fs.existsSync(join(projects[1],'.claude/skills/designer')),'other project removed');
 });
 await test('foreign destination is refused even without apply',()=>{
  const target=join(home,'.cursor/skills/designer');fs.mkdirSync(target,{recursive:true});fs.writeFileSync(join(target,'SKILL.md'),'foreign');
  const r=run(script('install-agent.mjs'),['--ai','cursor']);assert(r.status===3&&fs.readFileSync(join(target,'SKILL.md'),'utf8')==='foreign','foreign changed');
 });
 await test('integrity survives Git line-ending normalization of extensionless licenses',()=>{
  const at=join(box,'license-normalization');copyOf(at);
  for(const name of ['awesome-design-md','awesome-design-skills','claude-design-skills']) {
    const file=join(at,'licenses/upstream',name,'LICENSE');const text=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
    fs.writeFileSync(file,text.replace(/\n/g,'\r\n'));
  }
  assert(run(join(at,'scripts/build-manifest.mjs'),['--check']).status===0,'license newline regression');
 });
 await test('setup dry-run does not rewrite even a deliberately stale index',()=>{
  const at=join(box,'dry-run-copy');copyOf(at);const index=join(at,'data/reference-index.json');const idx=JSON.parse(fs.readFileSync(index,'utf8'));idx.sentinel='keep';fs.writeFileSync(index,JSON.stringify(idx));
  const before=manifestOf(at);const r=run(join(at,'scripts/setup.mjs'),['--profile','full']);assert(r.status===0&&manifestOf(at).sha256===before.sha256,'setup mutated');
  const doctor=JSON.parse(run(join(at,'scripts/doctor.mjs'),['--profile','core','--json']).stdout);assert(!doctor.coreOk,'stale integrity disguised as success');
 });
 await test('root override is honored and relative override rejected',()=>{
  const at=join(box,'override-copy');copyOf(at);const url=pathToFileURL(join(paths.packageRoot,'lib/paths.mjs')).href;
  const probe=(root)=>run('--input-type=module',['-e',
    'console.log((await import('+JSON.stringify(url)+')).paths.packageRoot)'],{env:{...env,DESIGNER_ROOT:root}});
  const a=probe(at);assert(a.status===0&&a.stdout.trim()===at,'override ignored');assert(probe('relative-root').status!==0,'relative accepted');
 });
 await test('explicit personal state inside a package is rejected',()=>{
  const r=run(script('record.mjs'),['--where'],{env:{...env,DESIGNER_STATE:join(paths.packageRoot,'forbidden-state')}});assert(r.status!==0&&!fs.existsSync(join(paths.packageRoot,'forbidden-state')),'state isolation failed');
 });
 await test('empty same-named directory never claims native discovery',()=>{
  const h=join(box,'empty-home');fs.mkdirSync(join(h,'.pi/agent/skills/designer'),{recursive:true});
  const r=JSON.parse(run(script('doctor.mjs'),['--profile','core','--agent','pi','--json'],{env:{...env,HOME:h,USERPROFILE:h}}).stdout);
  assert(r.summary['agent-files']==='PARTIAL'&&r.summary.agent==='PARTIAL','false registration success');
 });
 await test('doctor rejects unknown agent filters and uses registry aliases',()=>{
  assert(run(script('doctor.mjs'),['--agent','unknown','--json']).status===2,'unknown skipped');
  const r=JSON.parse(run(script('doctor.mjs'),['--profile','core','--agent','claude-code','--json']).stdout);assert(r.results.some(x=>x.label==='Claude Code'),'alias not selected');
 });
 await test('full doctor does not claim partial readiness as ok',()=>{
  const r=JSON.parse(run(script('doctor.mjs'),['--profile','full','--agent','pi','--json']).stdout);assert(r.coreOk&&!r.ok&&!r.fullyVerified,'partial disguised as pass');
 });
 await test('legacy import is read-only by default, idempotent and collision-safe',()=>{
  const legacy=join(box,'legacy'), destState=join(box,'migration-state');fs.mkdirSync(join(legacy,'approved'),{recursive:true});fs.writeFileSync(join(legacy,'approved','example.md'),'# Approved — trading\n\nWhy: scarce accents and dense consoles');
  const extra={env:{...env,DESIGNER_STATE:destState}};
  assert(run(script('record.mjs'),['import','--from',legacy],extra).status===0&&!fs.existsSync(destState),'import dry-run wrote');
  for(let i=0;i<2;i++) assert(run(script('record.mjs'),['import','--from',legacy,'--apply'],extra).status===0,'import failed');
  assert(fs.readdirSync(join(destState,'evals/approved')).length===1,'duplicate import');assert(fs.existsSync(join(legacy,'approved/example.md')),'source removed');
  const r=run(script('record.mjs'),['retrieve','scarce consoles'],extra);assert(r.stdout.includes('scarce accents'),'preference not retrieved');
 });
 await test('third same-day eval never overwrites earlier records',()=>{
  const s=join(box,'eval-collisions');for(let i=1;i<=3;i++) assert(run(script('record.mjs'),['approve','--project','same','--why','reason '+i],{env:{...env,DESIGNER_STATE:s}}).status===0,'record failed');
  assert(fs.readdirSync(join(s,'evals/approved')).length===3,'record overwritten');
 });
 await test('empty personal taste store does not learn from shipped examples',()=>{
  const extra={env:{...env,DESIGNER_STATE:join(box,'empty-evals')}};const r=run(script('record.mjs'),['retrieve','trading console'],extra);
  assert(r.stdout.includes('No recorded preference'),'sample treated as personal');
 });
 await test('clean registered copy uninstalls without removing package source',()=>{
  const r=run(script('uninstall-agent.mjs'),['--ai','pi','--apply']);assert(r.status===0&&!fs.existsSync(copy)&&fs.existsSync(join(paths.packageRoot,'SKILL.md')),'source/copy safety failed');
 });
 await test('expected link removal never follows into its source',()=>{
  const r=run(script('install-agent.mjs'),['--ai','pi','--mode','link','--apply']);assert(r.status===0,r.stderr);
  const u=run(script('uninstall-agent.mjs'),['--ai','pi','--apply']);assert(u.status===0&&fs.existsSync(join(paths.packageRoot,'SKILL.md'))&&!fs.existsSync(copy),'link safety failed');
 });
 console.log('\nParity regressions: '+pass+' passed; '+fail+' failed');
} finally {fs.rmSync(box,{recursive:true,force:true});}
process.exit(fail?1:0);
