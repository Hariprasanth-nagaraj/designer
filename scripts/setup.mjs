#!/usr/bin/env node
/** Plan-only default. Browser dependencies live in personal state, not in package/agent copies. */
import {mkdirSync,readFileSync,writeFileSync,renameSync,rmSync,mkdtempSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {spawnSync} from "node:child_process";
import {paths,findPack,displayPath} from "../lib/paths.mjs";
import {PLAYWRIGHT_VERSION,runtimeRoot,resolvePlaywright,probeBrowser} from "../lib/browser-runtime.mjs";
const argv=process.argv.slice(2), has=k=>argv.includes("--"+k);
const flag=(k,d=null)=>{const i=argv.indexOf("--"+k);return i>=0&&argv[i+1]&&!argv[i+1].startsWith("--")?argv[i+1]:d;};
const APPLY=has("apply"), profile=flag("profile","core");
const packRegistry=JSON.parse(readFileSync(join(paths.data,"optional-packs.json"),"utf8")).packs;
const packs=(flag("packs",profile==="full"?"ui-ux-pro-max,baoyu-design":"")||"").split(",").filter(Boolean);
function command(exe,args,options={}) {
  // On Windows invoke npm's JS entry, avoiding shell interpolation of state paths.
  if(exe==="npm" && process.platform==="win32") {
    const candidates=[process.env.npm_execpath,join(dirname(process.execPath),"node_modules","npm","bin","npm-cli.js")].filter(Boolean);
    const cli=candidates.find(existsSync);
    if(!cli) {
      const where=spawnSync("where.exe",["npm.cmd"],{encoding:"utf8"});
      for(const p of (where.stdout??"").trim().split(/\r?\n/)) {
        const candidate=join(dirname(p),"node_modules","npm","bin","npm-cli.js");
        if(existsSync(candidate)) return command(process.execPath,[candidate,...args],options);
      }
      throw new Error("npm CLI could not be resolved; install Node/npm first");
    }
    return command(process.execPath,[cli,...args],options);
  }
  const r=spawnSync(exe,args,{encoding:"utf8",timeout:900000,...options});
  if(r.status!==0) throw new Error((r.stderr||r.stdout||r.error?.message||"command failed").trim().slice(-1500));
  return r;
}
try {
  if(!["core","browser","full"].includes(profile)) throw new Error("Profile must be core, browser or full");
  if(packs.some(p=>!["ui-ux-pro-max","baoyu-design"].includes(p))) throw new Error("Unknown optional pack");
  const runtime=resolvePlaywright();
  if(APPLY && process.env.DESIGNER_PLAYWRIGHT && !runtime) throw new Error("Explicit DESIGNER_PLAYWRIGHT is invalid; correct it before setup");
  for(const name of packs) {
    const override=name==="ui-ux-pro-max"?process.env.DESIGNER_UIPM:process.env.DESIGNER_BAOYU;
    if(APPLY && override && !findPack(name)) throw new Error("Explicit optional pack override is invalid: "+name);
  }
  if(has("check-reuse")) {
    console.log("Playwright: "+(runtime?displayPath(runtime.dir):"not available"));
    for(const p of ["ui-ux-pro-max","baoyu-design"]) console.log(p+": "+(findPack(p)??"absent; optional"));
    process.exit(0);
  }
  console.log("Designer setup — "+profile+" — "+(APPLY?"APPLY":"DRY RUN; no writes or downloads"));
  console.log("State: "+displayPath(paths.stateRoot));
  console.log("Core: verify runtime/index and negative-control fixtures");
  if(profile!=="core") console.log(runtime?"Reuse pinned Playwright at "+runtime.dir:
    "Install playwright@"+PLAYWRIGHT_VERSION+" in "+runtimeRoot+"; then download Chromium and launch-test it");
  for(const p of packs) console.log(p+": "+(findPack(p)??"would fetch pinned licensed upstream repository into personal state"));
  if(!APPLY) {console.log("Re-run with --apply to execute. No package files changed.");process.exit(0);}
  if(Number(process.versions.node.split(".")[0])<20) throw new Error("Node 20+ required");
  if(!existsSync(paths.referenceIndex)) command(process.execPath,[join(paths.scripts,"build-reference-index.mjs")]);
  mkdirSync(paths.evals,{recursive:true});mkdirSync(paths.receipts,{recursive:true});
  const clean=spawnSync(process.execPath,[join(paths.scripts,"design-drift.mjs"),join(paths.packageRoot,"tests","fixtures","drift-ok")],{encoding:"utf8"});
  const bad=spawnSync(process.execPath,[join(paths.scripts,"design-drift.mjs"),join(paths.packageRoot,"tests","fixtures","drift-bad")],{encoding:"utf8"});
  if(clean.status!==0||bad.status!==1||!bad.stdout.includes("radius-drift")) throw new Error("Drift self-test failed");
  if(profile!=="core") {
    if(!runtime) {
      mkdirSync(dirname(runtimeRoot),{recursive:true});
      const lock=runtimeRoot+".lock";
      try {mkdirSync(lock);} catch {throw new Error("Browser setup already running (or stale lock): "+lock);}
      const stage=mkdtempSync(join(dirname(runtimeRoot),".playwright-stage-"));
      let backedUp=false;
      const backup=join(stage,"previous");
      try {
        writeFileSync(join(stage,"package.json"),JSON.stringify({name:"designer-browser-runtime",private:true,version:"1.0.0"}));
        command("npm",["install","--prefix",stage,"--ignore-scripts","--no-audit","--no-fund","--save-exact","playwright@"+PLAYWRIGHT_VERSION]);
        // Check the install before swapping into the shared runtime.
        if(!existsSync(join(stage,"node_modules","playwright","cli.js"))) throw new Error("Incomplete Playwright install");
        const payload=join(stage,"runtime");mkdirSync(payload);
        for(const p of ["node_modules","package.json","package-lock.json"]) renameSync(join(stage,p),join(payload,p));
        if(existsSync(runtimeRoot)) {renameSync(runtimeRoot,backup);backedUp=true;}
        renameSync(payload,runtimeRoot);
      } catch(e) {
        if(backedUp&&!existsSync(runtimeRoot)) {renameSync(backup,runtimeRoot);backedUp=false;}
        throw e;
      } finally {rmSync(stage,{recursive:true,force:true});rmSync(lock,{recursive:true,force:true});}
    }
    const found=resolvePlaywright();
    if(!found) throw new Error("Pinned library still unavailable; check DESIGNER_PLAYWRIGHT override");
    const browserEnv={...process.env};
    if(found.managed&&!browserEnv.PLAYWRIGHT_BROWSERS_PATH) browserEnv.PLAYWRIGHT_BROWSERS_PATH=join(runtimeRoot,"browsers");
    command(process.execPath,[join(found.dir,"cli.js"),"install","chromium"],{env:browserEnv});
    const probe=await probeBrowser();console.log("Browser launched and screenshot captured: "+probe.bytes+" bytes");
  }
  for(const name of packs) {
    if(findPack(name)) {console.log("Reuse optional pack: "+findPack(name));continue;}
    const spec=packRegistry[name], target=join(paths.stateRoot,"packs",name);
    if(existsSync(target)) throw new Error("Incomplete/foreign optional pack retained: "+target);
    mkdirSync(dirname(target),{recursive:true});
    const stage=mkdtempSync(join(dirname(target),".pack-stage-"));
    try {
      command("git",["init",stage]);command("git",["-C",stage,"remote","add","origin",spec.repository]);
      command("git",["-C",stage,"fetch","--depth","1","origin",spec.commit]);
      command("git",["-C",stage,"checkout","--detach","FETCH_HEAD"]);
      if(!existsSync(join(stage,spec.licensePath)) || !readFileSync(join(stage,spec.licensePath),"utf8").includes("MIT License")) throw new Error("Pinned upstream licence unavailable: "+name);
      if(!existsSync(join(stage,spec.skillPath,"SKILL.md"))) throw new Error("Pinned skill missing: "+name);
      renameSync(stage,target);console.log("Installed optional upstream "+name+" at "+spec.commit);
    } finally {if(existsSync(stage)) rmSync(stage,{recursive:true,force:true});}
  }
  console.log("Setup complete for "+profile+". Use designer-install-agent --ai <id> --apply; doctor reports client/MCP verification separately.");
} catch(e) {console.error(e.message);process.exitCode=1;}
