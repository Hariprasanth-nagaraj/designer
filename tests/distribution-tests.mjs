#!/usr/bin/env node
/** Real npm archive -> consumer install -> copied skill -> shared browser -> booking outcome. */
import * as fs from "node:fs";
import {join,dirname,resolve} from "node:path";
import {tmpdir} from "node:os";
import {spawn,spawnSync} from "node:child_process";
import {createServer} from "node:http";
import {pathToFileURL} from "node:url";
import {paths} from "../lib/paths.mjs";
const box=fs.mkdtempSync(join(tmpdir(),"designer-distribution-")), argv=process.argv.slice(2);
const i=argv.indexOf("--out"), evidence=resolve(i>=0?argv[i+1]:join(box,"evidence"));fs.mkdirSync(evidence,{recursive:true});
const home=join(box,"isolated home"), state=join(box,"personal state");fs.mkdirSync(home);
const env={...process.env,HOME:home,USERPROFILE:home,LOCALAPPDATA:join(home,"local"),DESIGNER_STATE:state,DESIGNER_UIPM:"",DESIGNER_BAOYU:""};
delete env.DESIGNER_ROOT;delete env.DESIGNER_PLAYWRIGHT;
const log=[];
function run(exe,args,options={}) {
 return new Promise((yes,no)=>{
  const p=spawn(exe,args,{cwd:box,env,...options});let stdout="",stderr="";
  const timer=setTimeout(()=>{p.kill();no(new Error("Timed out: "+exe));},900000);
  p.stdout.on("data",b=>stdout+=b);p.stderr.on("data",b=>stderr+=b);p.on("error",e=>{clearTimeout(timer);no(e)});
  p.on("close",status=>{clearTimeout(timer);log.push({exe,args,status,stdout,stderr});if(status!==0)no(new Error(stderr||stdout||"exit "+status));else yes({stdout,stderr});});
 });
}
function npmCli() {
 const candidates=[process.env.npm_execpath,join(dirname(process.execPath),"node_modules/npm/bin/npm-cli.js")].filter(Boolean);
 let found=candidates.find(fs.existsSync);if(found)return found;
 if(process.platform==="win32"){
  const r=spawnSync("where.exe",["npm.cmd"],{encoding:"utf8"});
  for(const p of(r.stdout??"").trim().split(/\r?\n/)){const q=join(dirname(p),"node_modules/npm/bin/npm-cli.js");if(fs.existsSync(q))return q;}
 }
 // npm may be installed under a separate prefix on macOS/Linux.
 const r=spawnSync("which",["npm"],{encoding:"utf8"});if(r.status===0)return fs.realpathSync(r.stdout.trim());
 throw new Error("Cannot find npm CLI");
}
let server;
try {
 const cli=npmCli(), npm=(args,options={})=>run(process.execPath,[cli,...args],options);
 const packed=JSON.parse((await npm(["pack","--json","--pack-destination",box],{cwd:paths.packageRoot})).stdout)[0];
 const fileNames=packed.files.map(f=>f.path);
 for(const p of ["package.json","SECURITY.md","dependencies.lock.json","tests/fixtures/browser/index.html"]) if(!fileNames.includes(p))throw new Error("Archive missing "+p);
 const consumer=join(box,"consumer");
 await npm(["install","--prefix",consumer,"--ignore-scripts","--omit=dev","--no-audit","--no-fund",join(box,packed.filename)]);
 const pkg=JSON.parse(fs.readFileSync(join(paths.packageRoot,"package.json"),"utf8"));
 const installed=join(consumer,"node_modules",...pkg.name.split("/"));
 if(fs.existsSync(join(installed,"node_modules/playwright")) || fs.existsSync(join(consumer,"node_modules/playwright")))throw new Error("Consumer unintentionally received dev runtime");
 await run(process.execPath,[join(installed,"tests/run-tests.mjs")]);
 await run(process.execPath,[join(installed,"scripts/install-agent.mjs"),"--ai","pi","--mode","copy","--apply"]);
 const copy=join(home,".pi/agent/skills/designer");
 await run(process.execPath,[join(copy,"tests/run-tests.mjs")]);
 await run(process.execPath,[join(copy,"scripts/setup.mjs"),"--profile","browser","--apply"]);
 const doctor=JSON.parse((await run(process.execPath,[join(copy,"scripts/doctor.mjs"),"--profile","browser","--json"])).stdout);
 if(!doctor.browserReady||!doctor.ok)throw new Error("Installed-copy browser not ready");
 const fixture=join(copy,"tests/fixtures/browser");
 server=createServer((req,res)=>{
  const p=req.url==="/tokens.css"?"tokens.css":"index.html";
  res.setHeader("Content-Type",p.endsWith(".css")?"text/css":"text/html");
  const source=fs.readFileSync(join(fixture,p));
  res.end(req.url==="/bad" ? source.toString().replace("</head>","<style>button:focus,input:focus,select:focus{outline:none;box-shadow:none}</style></head>") : source);
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const url="http://127.0.0.1:"+server.address().port;
 await run(process.execPath,[join(copy,"scripts/design-audit.mjs"),"--url",url,"--out",join(evidence,"audit")]);
 let rejected=false;
 try {await run(process.execPath,[join(copy,"scripts/design-audit.mjs"),"--url",url+"/bad","--out",join(evidence,"negative-audit")]);} catch {rejected=true;}
 const negative=JSON.parse(fs.readFileSync(join(evidence,"negative-audit/report.json"),"utf8"));
 if(!rejected || !negative.findings.some(f=>f.check==="focus-visible"&&f.severity==="high")) throw new Error("Audit failed to reject planted focus defect");
 const runtimeUrl=pathToFileURL(join(copy,"lib/browser-runtime.mjs")).href;
 const flow=`import assert from "node:assert/strict";
 const {loadPlaywright}=await import(${JSON.stringify(runtimeUrl)});
 const {chromium}=await loadPlaywright();const b=await chromium.launch();
 try {const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];
 p.on("pageerror",e=>errors.push(e.message));await p.goto(${JSON.stringify(url)});
 await p.getByRole("button",{name:"Review booking"}).click();
 assert.match(await p.locator("#error").textContent(),/Enter the patient name/);
 await p.getByLabel("Patient name").fill("Asha Patel");
 await p.getByRole("button",{name:"Review booking"}).click();
 assert.equal(await p.locator("#appointments tr").count(),0);
 await p.getByRole("button",{name:"Keep editing"}).click();
 assert.equal(await p.locator("#appointments tr").count(),0);
 await p.getByRole("button",{name:"Review booking"}).click();
 await p.getByRole("button",{name:"Confirm booking"}).click();
 assert.match(await p.locator("#status").textContent(),/Booked Asha Patel at 09:00/);
 assert.equal(await p.locator("#appointments tr").count(),1);
 await p.getByLabel("Patient name").fill("Another patient");
 await p.getByRole("button",{name:"Review booking"}).click();
 assert.match(await p.locator("#error").textContent(),/already booked/);
 assert.equal(await p.locator("#appointments tr").count(),1);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);await p.screenshot({path:${JSON.stringify(join(evidence,"booking-outcome.png"))},fullPage:true});
 console.log("Booking outcome checks passed: invalid, review-before-commit, cancel, booked state, duplicate recovery, mobile overflow, console");
 } finally {await b.close();}`;
 await run(process.execPath,["--input-type=module","-e",flow]);
 const result={package:pkg.name,version:pkg.version,archiveEntries:packed.entryCount,consumerCore:true,copyCore:true,copyBrowserBootstrap:true,browserReady:doctor.browserReady,auditNegativeControl:true,flow:true,nativeClientDiscovery:"not exercised",modelGenerationComparison:"not exercised"};
 fs.writeFileSync(join(evidence,"result.json"),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
} catch(e) {console.error(e.message);if(process.env.CI) console.error("::error title=Distribution regression::"+e.message.replace(/%/g,"%25").replace(/\r/g,"%0D").replace(/\n/g,"%0A"));process.exitCode=1;}
finally {if(server)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(join(evidence,"commands.json"),JSON.stringify(log,null,2));fs.rmSync(box,{recursive:true,force:true});}
