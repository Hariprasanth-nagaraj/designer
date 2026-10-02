#!/usr/bin/env node
/** Report exact lazily-loadable knowledge locations. Never loads the entire collection. */
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {paths,findPack} from "../lib/paths.mjs";
const packs=JSON.parse(readFileSync(join(paths.data,"optional-packs.json"),"utf8")).packs;
const result={root:paths.packageRoot,bundled:{
aesthetic:join(paths.data,"frontend-design.md"),
productTypes:join(paths.data,"product-intelligence/products.csv"),
ux:join(paths.data,"ux-pipeline-skills"),
director:join(paths.references,"design-director.md"),grammar:join(paths.references,"design-grammar.md"),review:join(paths.references,"design-review.md")
},external:{}};
for(const name of Object.keys(packs)) {
  const root=findPack(name);
  const local=root?join(root,"SKILL.md"):null;
  const managed=join(paths.stateRoot,"packs",name,packs[name].skillPath,"SKILL.md");
  result.external[name]={available:!!root,root,skill:local&&existsSync(local)?local:existsSync(managed)?managed:null};
}
console.log(JSON.stringify(result,null,2));
