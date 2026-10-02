#!/usr/bin/env node
/** Explicit install; dry-run by default. Stage, validate, swap, then receipt; rollback on errors. */
import {readFileSync,writeFileSync,mkdirSync,rmSync,renameSync,cpSync,symlinkSync,mkdtempSync} from "node:fs";
import {join,dirname} from "node:path";
import {paths,displayPath} from "../lib/paths.mjs";
import {agents,agentFor,detected,directoryFor,invocation} from "../lib/agents.mjs";
import {PAYLOAD,entryExists,pathKey,within,manifestOf,recordsFor,receiptFor,unchanged,validatePayload} from "../lib/installations.mjs";
const argv=process.argv.slice(2);
const flag=(k,d=null)=>{const i=argv.indexOf("--"+k);return i>=0 && argv[i+1] && !argv[i+1].startsWith("--") ? argv[i+1] : d;};
const has=k=>argv.includes("--"+k);
const APPLY=has("apply"), id=flag("ai",flag("agent")), scope=flag("scope","user"), requestedMode=flag("mode","copy");
try {
  if(!["user","project"].includes(scope)) throw new Error("--scope must be user or project");
  if(!["copy","link"].includes(requestedMode)) throw new Error("--mode must be copy or link");
  if(has("print-bridge")) {
    console.log("Read "+displayPath(join(paths.packageRoot,"SKILL.md"))+" and follow it for this task.");
    process.exit(0);
  }
  if(id && id!=="all" && !agentFor(id)) throw new Error("Unknown agent: "+id);
  if(has("list")) {
    for(const a of agents) console.log((detected(a) ? "config detected " : "not detected    ")+a.id.padEnd(12)+displayPath(directoryFor(a,scope)??"(manual bridge)")+" [placement only; discovery unverified]");
    process.exit(0);
  }
  const selected=id && id!=="all" ? [agentFor(id)] : agents.filter(detected);
  if(!selected.length) {console.log("No agent config markers detected. Use --list or --ai universal. No changes made.");process.exit(0);}
  const pkg=validatePayload(paths.packageRoot);
  const plans=selected.map(a=>{
    const dir=directoryFor(a,scope);
    if(!dir) throw new Error(a.id+" has no "+scope+" placement. Use --print-bridge.");
    const dest=join(dir,"designer");
    if(within(paths.packageRoot,dest)) throw new Error("Destination would contain/delete the package source: "+dest);
    const previous=recordsFor(dest), exists=entryExists(dest);
    const owner=previous.find(r=>unchanged(dest,r));
    return {a,dir,dest,previous,exists,owner,blocked:exists&&!owner};
  });
  console.log("Designer install — "+(APPLY?"APPLY":"DRY RUN")+"; "+scope+"; "+requestedMode);
  for(const p of plans) console.log((p.blocked?"CONFLICT / edited":p.exists?"update unchanged":"install")+" "+p.a.id+" "+displayPath(p.dest));
  if(plans.some(p=>p.blocked)) {
    console.error("Refusing foreign or edited destinations. Move/backup your edits manually; nothing changed.");
    process.exit(3);
  }
  if(!APPLY) {console.log("No changes. Re-run with --apply. Client discovery remains unverified.");process.exit(0);}
  mkdirSync(paths.receipts,{recursive:true});
  for(const p of plans) {
    mkdirSync(p.dir,{recursive:true});
    // Recheck ownership immediately before mutation.
    if(entryExists(p.dest) && (!p.owner || !unchanged(p.dest,p.owner))) throw new Error("Destination changed after planning: "+p.dest);
    const stage=mkdtempSync(join(p.dir,".designer-stage-"));
    const candidate=join(stage,"payload"), backup=join(stage,"backup");
    const receipt=receiptFor(p.a.id,p.dest), receiptTmp=join(stage,"receipt.json");
    let mode=requestedMode, moved=false, placed=false, committed=false;
    try {
      if(mode==="link") {
        try {symlinkSync(paths.packageRoot,candidate,process.platform==="win32"?"junction":"dir");}
        catch(e) {mode="copy";console.log("Link unavailable; explicitly falling back to copy: "+e.code);}
      }
      if(mode==="copy") {
        mkdirSync(candidate);
        for(const item of PAYLOAD) if(entryExists(join(paths.packageRoot,item))) cpSync(join(paths.packageRoot,item),join(candidate,item),{recursive:true});
        validatePayload(candidate);
      }
      const manifest=mode==="copy"?manifestOf(candidate):null;
      writeFileSync(receiptTmp,JSON.stringify({schemaVersion:2,agent:p.a.id,scope,destination:p.dest,mode,source:paths.packageRoot,sourceVersion:pkg.version,installedAt:new Date().toISOString(),payload:PAYLOAD,manifest},null,2)+"\n",{flag:"wx"});
      if(p.exists) {renameSync(p.dest,backup);moved=true;}
      renameSync(candidate,p.dest);placed=true;
      // A test can inject a failed commit in the isolated regression harness.
      if(process.env.DESIGNER_TEST_FAIL_INSTALL_COMMIT==="1") throw new Error("Injected commit failure");
      renameSync(receiptTmp,receipt);committed=true;
      for(const old of p.previous) if(pathKey(old.receiptFile)!==pathKey(receipt)) rmSync(old.receiptFile,{force:true});
      console.log("Placed "+p.a.id+" ("+mode+"): "+displayPath(p.dest));
      console.log("Reload client, then "+invocation(p.a).replace("<installed-directory>",displayPath(p.dest)));
    } catch(e) {
      if(!committed) {
        if(placed) rmSync(p.dest,{recursive:true,force:true});
        if(moved) {renameSync(backup,p.dest);moved=false;}
      }
      throw e;
    } finally {
      // If rollback itself failed, retain backup and explain its location instead of deleting it.
      if(moved && !committed) console.error("Recovery backup retained at "+backup);
      else rmSync(stage,{recursive:true,force:true});
    }
  }
  console.log("Placement complete, not client/MCP certification. No agent configuration was replaced.");
} catch(e) {console.error(e.message);process.exitCode=2;}
