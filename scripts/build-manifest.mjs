#!/usr/bin/env node
/** Reproducible provenance manifest. --check is read-only and fails on stale content. */
import {readFileSync,writeFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {paths} from "../lib/paths.mjs";
const root=paths.packageRoot, pkg=JSON.parse(readFileSync(join(root,"package.json"),"utf8"));
const walk=(rel)=>readdirSync(join(root,rel),{withFileTypes:true}).filter(e=>e.name!==".DS_Store").sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?walk(rel+"/"+e.name):[rel+"/"+e.name]);
const bytes=rel=>{const b=readFileSync(join(root,rel));return /(?:\.(md|mjs|js|json|html|css|svg|yml|txt|csv)$|(?:^|\/)LICENSE$)/.test(rel)?Buffer.from(b.toString("utf8").replace(/\r\n/g,"\n")):b;};
const sha=rel=>createHash("sha256").update(bytes(rel)).digest("hex");
const authoredFiles=["SKILL.md","README.md","SECURITY.md","THIRD_PARTY_NOTICES.md",...["lib","scripts","references","benchmarks","adapters","docs","tests"].flatMap(walk)].sort();
const bundledData={};
for(const name of ["brand-systems","style-archetypes","ux-pipeline-skills","product-intelligence"]) {
  const files=walk("data/"+name), digest=createHash("sha256");
  let size=0;for(const rel of files){const b=bytes(rel);size+=b.length;digest.update(rel);digest.update(b);}
  bundledData[name]={files:files.length,bytes:size,sha256:digest.digest("hex")};
}
const dataFiles=["data/agents.json","data/optional-packs.json","data/frontend-design.md","data/reference-index.json",...walk("licenses")];
const output={schemaVersion:2,package:pkg.name,version:pkg.version,hashAlgorithm:"SHA-256; text line endings normalized to LF",packageContract:{engines:pkg.engines,bin:pkg.bin,files:pkg.files,pi:pkg.pi},authored:Object.fromEntries(authoredFiles.map(p=>[p,sha(p)])),data:Object.fromEntries(dataFiles.map(p=>[p,sha(p)])),bundledData,upstream:JSON.parse(readFileSync(join(root,"licenses/upstream/uipm-stack/SOURCE.json"),"utf8")),runtimeDependencies:{playwright:pkg.devDependencies.playwright},optionalPacks:JSON.parse(readFileSync(join(paths.data,"optional-packs.json"),"utf8")).packs};
const text=JSON.stringify(output,null,2)+"\n", file=join(root,"dependencies.lock.json");
if(process.argv.includes("--check")) {
  if(readFileSync(file,"utf8").replace(/\r\n/g,"\n")!==text) {console.error("Provenance manifest stale; run npm run build-manifest");process.exit(1);}
  console.log("Provenance manifest current");
} else {writeFileSync(file,text);console.log("Provenance manifest built");}
