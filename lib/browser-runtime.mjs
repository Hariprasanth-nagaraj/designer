/** One pinned Playwright resolver for setup, audit, doctor and project flow scripts. */
import {existsSync,readFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {createRequire} from "node:module";
import {paths} from "./paths.mjs";
export const PLAYWRIGHT_VERSION=JSON.parse(readFileSync(join(paths.packageRoot,"package.json"),"utf8")).devDependencies.playwright;
export const runtimeRoot=join(paths.stateRoot,"runtime","playwright-"+PLAYWRIGHT_VERSION);
const require=createRequire(import.meta.url);
export function resolvePlaywright() {
  const override=process.env.DESIGNER_PLAYWRIGHT;
  const candidates=override?[{dir:resolve(override),managed:false}]:[
    {dir:join(runtimeRoot,"node_modules","playwright"),managed:true},
    {dir:join(paths.packageRoot,"node_modules","playwright"),managed:false}
  ];
  for(const candidate of candidates) {
    try {
      const meta=JSON.parse(readFileSync(join(candidate.dir,"package.json"),"utf8"));
      if(meta.version!==PLAYWRIGHT_VERSION) continue;
      const entry=require.resolve(candidate.dir);
      return {...candidate,entry,version:meta.version};
    } catch {}
  }
  return null;
}
export async function loadPlaywright() {
  const found=resolvePlaywright();
  if(!found) throw new Error("Pinned Playwright unavailable. Run designer-setup --profile browser --apply (or set DESIGNER_PLAYWRIGHT to a matching module directory).");
  if(found.managed && !process.env.PLAYWRIGHT_BROWSERS_PATH) process.env.PLAYWRIGHT_BROWSERS_PATH=join(runtimeRoot,"browsers");
  const loaded=await import(pathToFileURL(found.entry).href);
  return loaded.chromium?loaded:loaded.default;
}
export async function probeBrowser() {
  const {chromium}=await loadPlaywright();
  let b;
  try {b=await chromium.launch();const p=await b.newPage();await p.setContent("<h1>Designer browser probe</h1>");const bytes=(await p.screenshot()).length;return {bytes,library:resolvePlaywright().dir};}
  finally {if(b) await b.close();}
}
