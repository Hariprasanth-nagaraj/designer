#!/usr/bin/env node
/** Receipt-selected uninstall. Edited copies and unexpected links are retained with their receipts. */
import {rmSync} from "node:fs";
import {resolve} from "node:path";
import {paths,displayPath} from "../lib/paths.mjs";
import {agentFor,directoryFor} from "../lib/agents.mjs";
import {receipts,entryExists,pathKey,unchanged,within} from "../lib/installations.mjs";
const argv=process.argv.slice(2), has=k=>argv.includes("--"+k);
const flag=(k,d=null)=>{const i=argv.indexOf("--"+k);return i>=0 && argv[i+1] && !argv[i+1].startsWith("--")?argv[i+1]:d;};
try {
  const id=flag("ai",flag("agent")), a=id?agentFor(id):null;
  if(id && !a) throw new Error("Unknown agent: "+id);
  const scope=flag("scope"); if(scope&&!["user","project"].includes(scope)) throw new Error("Invalid scope");
  let rows=receipts().filter(r=>!a || r.agent===a.id || agentFor(r.agent)?.id===a.id);
  const dest=flag("destination");
  if(dest) rows=rows.filter(r=>pathKey(r.destination)===pathKey(resolve(dest)));
  if(scope) {
    if(!a) throw new Error("--scope needs --ai");
    const d=directoryFor(a,scope);
    rows=rows.filter(r=>d && pathKey(r.destination)===pathKey(resolve(d,"designer")));
  }
  if(!id && !dest) {for(const r of rows) console.log(r.agent+" "+displayPath(r.destination));console.log("Choose --ai and, if needed, --scope or --destination. Dry-run by default.");process.exit(0);}
  if(rows.length>1&&!has("all")) throw new Error("Multiple registrations. Choose --scope, --destination, or explicit --all.");
  for(const r of rows) {
    const selfCopy = r.mode === "copy" && pathKey(paths.packageRoot) === pathKey(r.destination) && r.source && !within(r.source, r.destination);
    if(within(paths.packageRoot,r.destination) && !selfCopy) throw new Error("Refusing destination containing package source");
    if(entryExists(r.destination)&&!unchanged(r.destination,r)) {
      console.error("Edited or unexpected destination retained, including receipt: "+r.destination);process.exitCode=3;continue;
    }
    console.log((has("apply")?"Remove ":"Would remove ")+displayPath(r.destination));
    if(has("apply")) {if(entryExists(r.destination)) rmSync(r.destination,{recursive:true,force:true});rmSync(r.receiptFile,{force:true});}
  }
  if(has("purge-state")) {
    if(!rows.length || process.exitCode) throw new Error("Refusing state purge without successful selected uninstall");
    console.log((has("apply")?"Remove ":"Would remove ")+"personal evals at "+paths.evals);
    if(has("apply")) rmSync(paths.evals,{recursive:true,force:true});
  } else console.log("Personal evals and browser runtime are retained.");
} catch(e) {console.error(e.message);process.exitCode=2;}
