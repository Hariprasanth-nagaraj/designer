/** File ownership and destination-keyed receipts; never infer ownership from a name. */
import {readFileSync, readdirSync, existsSync, lstatSync, readlinkSync} from "node:fs";
import {createHash} from "node:crypto";
import {join, resolve, relative, isAbsolute} from "node:path";
import {paths} from "./paths.mjs";
export const PAYLOAD = ["SKILL.md","package.json","package-lock.json","dependencies.lock.json","references","scripts","data","benchmarks","lib","licenses","tests","examples","adapters","docs","THIRD_PARTY_NOTICES.md","LICENSE","README.md","SECURITY.md"];
export function entryExists(p) {try {lstatSync(p); return true;} catch {return false;}}
export const pathKey = p => process.platform === "win32" ? resolve(p).toLowerCase() : resolve(p);
export function within(p, root) {const r = relative(root,p);return !r || (!r.startsWith("..") && !isAbsolute(r));}
export function manifestOf(root) {
  const hash=createHash("sha256"); let files=0;
  const walk=(dir,prefix="") => {
    for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const rel=prefix ? prefix+"/"+e.name : e.name, file=join(dir,e.name);
      if(e.isSymbolicLink()) throw new Error("Unexpected nested symlink: "+file);
      if(e.isDirectory()) walk(file,rel);
      else {files++;hash.update(rel);hash.update(readFileSync(file));}
    }
  };
  walk(root); return {files,sha256:hash.digest("hex")};
}
export function receipts() {
  if(!existsSync(paths.receipts)) return [];
  return readdirSync(paths.receipts).filter(f=>f.endsWith(".json")).map(f=>{
    try {return {...JSON.parse(readFileSync(join(paths.receipts,f),"utf8")), receiptFile:join(paths.receipts,f)};}
    catch {throw new Error("Unreadable receipt: "+join(paths.receipts,f));}
  });
}
export const receiptFor = (id,dest) => join(paths.receipts, id+"-"+createHash("sha256").update(pathKey(dest)).digest("hex").slice(0,20)+".json");
export const recordsFor = dest => receipts().filter(r=>r.destination && pathKey(r.destination)===pathKey(dest));
export function unchanged(dest,receipt) {
  if(!entryExists(dest)) return true;
  const st=lstatSync(dest);
  if(st.isSymbolicLink()) {
    return receipt?.mode==="link" && receipt.source &&
      pathKey(resolve(dest,"..",readlinkSync(dest)))===pathKey(receipt.source);
  }
  if(!st.isDirectory() || receipt?.mode!=="copy" || !receipt.manifest?.sha256) return false;
  try {const m=manifestOf(dest);return m.sha256===receipt.manifest.sha256 && m.files===receipt.manifest.files;}
  catch {return false;}
}
export function validatePayload(root) {
  for(const item of PAYLOAD) {
    // npm excludes package-lock.json even when files lists it. Runtime setup never needs it.
    if(item==="package-lock.json") continue;
    if(!existsSync(join(root,item))) throw new Error("Incomplete package payload: "+item);
  }
  const pkg=JSON.parse(readFileSync(join(root,"package.json"),"utf8"));
  if(!pkg.version || !pkg.name) throw new Error("Invalid package metadata");
  return pkg;
}
