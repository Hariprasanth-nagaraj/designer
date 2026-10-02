#!/usr/bin/env node
/**
 * pick-references.mjs — contextual reference selector.
 *
 * Ranks a SMALL, relevant set of design references by fit, not popularity.
 * Two layers, because they answer different questions:
 *
 *   Layer A  product-type intelligence  (OPTIONAL external pack)
 *            ui-ux-pro-max products.csv — answers "what does this KIND of
 *            product look like". NOT bundled: no redistributable license was
 *            found for the installed copy. Degrades to empty when absent.
 *
 *   Layer B  brand-language reference    (bundled, MIT)
 *            74 real design systems + 68 style archetypes — answers "how does a
 *            mature team actually relate colour, type, density and surfaces".
 *
 * Layer B is marketing/design-site shaped, so clinical, CRM and internal-ops
 * coverage is genuinely thin. This script reports that honestly instead of
 * returning confident nonsense.
 *
 * Usage:
 *   node scripts/pick-references.mjs "high-density trading dashboard for day traders"
 *   node scripts/pick-references.mjs "clinic scheduling for a multi-provider practice" -n 3
 *   node scripts/pick-references.mjs "developer tool" --json
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { paths, findPack, displayPath } from "../lib/paths.mjs";

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const flags = { n: 3, kind: "all", json: false, requireLayerA: false };
const words = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "-n" || a === "--max") flags.n = Number(argv[++i]);
  else if (a === "--kind") flags.kind = argv[++i];
  else if (a === "--json") flags.json = true;
  else if (a === "--require-layer-a") flags.requireLayerA = true;
  else words.push(a);
}
const query = words.join(" ").trim();
if (!query) {
  console.error('Usage: node scripts/pick-references.mjs "<product + user + task>" [-n N] [--kind all|brand|archetype] [--json]');
  process.exit(64);
}

if (!existsSync(paths.referenceIndex)) {
  console.error(`reference index missing: ${displayPath(paths.referenceIndex)}`);
  console.error("run: node scripts/build-reference-index.mjs");
  process.exit(1);
}
const index = JSON.parse(readFileSync(paths.referenceIndex, "utf8"));

// ---------------------------------------------------------------- tokenise
const STOP = new Set(["a","an","the","for","with","and","or","of","to","in","on","at","by","that","this","it","is","are","be","as","from","we","i","my","our","their","app","application","software","product","system","tool","platform","website","web","page","pages","ui","ux","design","build","make","create","need","want","user","users","need","many","much","some","very","all","more","most","each","every","into","over","about","have","has","will","can","should","would","there","their","which","when","what","them","then","than","also","just","like","get","got","use","used","using","one","two","new","way","well","back","own","same","other","such","only","very","still","how","why","here","them","does","doing","done","own","too","now","off","out","own"]);
const tokenize = (s) =>
  s.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/-/g, " ")
    .split(/\s+/).map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w));

const qTokens = tokenize(query);
const qSet = new Set(qTokens);

// ---------------------------------------------------------------- layer A (optional)
function csvParse(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

let productTypes = [];
let layerAStatus = { present: false, reason: "", count: 0 };
const uipmRoot = findPack("ui-ux-pro-max");
const externalCsv = uipmRoot ? join(uipmRoot, "data", "products.csv") : null;
const uipmCsv = externalCsv && existsSync(externalCsv) ? externalCsv : join(paths.data, "product-intelligence", "products.csv");

if (uipmCsv && existsSync(uipmCsv)) {
  const [head, ...rows] = csvParse(readFileSync(uipmCsv, "utf8"));
  const col = (n) => head.indexOf(n);
  const cType = col("Product Type"), cKw = col("Keywords"), cStyle = col("Primary Style Recommendation"),
    cLanding = col("Landing Page Pattern"), cDash = col("Dashboard Style (if applicable)"),
    cPal = col("Color Palette Focus"), cKey = col("Key Considerations");
  for (const r of rows) {
    if (!r[cType]) continue;
    productTypes.push({
      type: r[cType], keywords: cKw > -1 ? (r[cKw] ?? "") : "",
      style: cStyle > -1 ? (r[cStyle] ?? "") : "",
      landing: cLanding > -1 ? (r[cLanding] ?? "") : "",
      dashboard: cDash > -1 ? (r[cDash] ?? "") : "",
      palette: cPal > -1 ? (r[cPal] ?? "") : "",
      considerations: cKey > -1 ? (r[cKey] ?? "") : "",
      tokens: new Set(tokenize(`${r[cType]} ${cKw > -1 ? (r[cKw] ?? "") : ""}`)),
    });
  }
  layerAStatus = { present: true, reason: "", count: productTypes.length, source: uipmCsv === externalCsv ? "external" : "bundled" };
} else {
  layerAStatus = {
    present: false,
    count: 0,
    reason: uipmCsv
      ? `found the ui-ux-pro-max pack but products.csv is missing at ${displayPath(uipmCsv)}`
      : "ui-ux-pro-max is an optional external pack and is not installed",
  };
}

if (flags.requireLayerA && !layerAStatus.present) {
  console.error(`Layer A requested but unavailable: ${layerAStatus.reason}`);
  console.error("Install the optional knowledge pack, or run without --require-layer-a.");
  process.exit(3);
}

// IDF: a term in many product types is a weak signal; a term in two is strong.
const df = new Map();
for (const p of productTypes) for (const t of p.tokens) df.set(t, (df.get(t) ?? 0) + 1);
const N = Math.max(productTypes.length, 1);
const idf = (t) => Math.log(1 + N / (1 + (df.get(t) ?? 0)));
const idfTable = new Map();
for (const t of new Set([...df.keys(), ...qSet])) idfTable.set(t, idf(t));

const layerA = productTypes
  .map((p) => {
    let score = 0; const hits = [];
    for (const t of qSet) if (p.tokens.has(t)) { score += idfTable.get(t); hits.push(t); }
    if (p.type.toLowerCase().split(/\s+/).some((w) => qSet.has(w))) score += 2.5;
    return { p, score, hits };
  })
  .filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

// ---------------------------------------------------------------- layer B (bundled)
const nEntries = Math.max(index.entries.length, 1);
const edf = new Map();
for (const e of index.entries) for (const t of e.keywords) edf.set(t, (edf.get(t) ?? 0) + 1);

const layerB = index.entries
  .filter((e) => flags.kind === "all" || (flags.kind === "brand" ? e.kind === "brand-system" : e.kind === "style-archetype"))
  .map((e) => {
    let score = 0; const hits = [];
    for (const t of qSet) {
      if (!e.keywords.includes(t)) continue;
      const w = Math.log(1 + nEntries / (1 + (edf.get(t) ?? 0)));
      score += e.id.toLowerCase().includes(t) ? w * 2.5 : w;
      hits.push(t);
    }
    const facetHit = e.facets.filter((f) => tokenize(f.replace(/-/g, " ")).some((t) => qSet.has(t)));
    score += facetHit.length * 1.2;
    if (qSet.has("dense") || qSet.has("dashboard") || qSet.has("data") || qSet.has("internal")) {
      if (e.density === "medium-high") score += 1.5;
    }
    return { e, score, hits, facetHit };
  })
  .filter((r) => r.score > 0.4).sort((a, b) => b.score - a.score).slice(0, flags.n);

// ---------------------------------------------------------------- coverage honesty
const covered = new Set(layerB.flatMap((r) => r.hits));
const uncovered = qTokens.filter((t) => !covered.has(t) && (df.get(t) ?? 0) === 0 && t.length > 3);

// ---------------------------------------------------------------- report
if (flags.json) {
  console.log(JSON.stringify({
    query, layerAStatus,
    layerA: layerA.map((r) => ({ type: r.p.type, score: +r.score.toFixed(2), style: r.p.style, landing: r.p.landing, dashboard: r.p.dashboard, palette: r.p.palette, considerations: r.p.considerations, matched: r.hits })),
    layerB: layerB.map((r) => ({ id: r.e.id, name: r.e.name, kind: r.e.kind, score: +r.score.toFixed(2), matched: r.hits, facets: r.facetHit, density: r.e.density, darkFirst: r.e.darkFirst, path: r.e.path, description: r.e.description })),
    uncovered,
  }, null, 2));
  process.exit(0);
}

const NL = "\n";
const rule = "=".repeat(Math.max(60, query.length + 24));
console.log(`REFERENCE SELECTION — "${query}"${NL}${rule}${NL}`);

console.log(`LAYER A — product-type intelligence${NL}`);
if (!layerAStatus.present) {
  console.log(`  (unavailable: ${layerAStatus.reason})${NL}`);
  console.log(`  This is an OPTIONAL pack. Without it, derive product-type decisions from${NL}`);
  console.log(`  product context and Layer B. Do not treat Layer B alone as product-type truth.${NL}`);
} else if (!layerA.length) {
  console.log(`  (${layerAStatus.count} product types loaded, but no confident match — treat as greenfield)${NL}`);
} else {
  console.log(`  source: ${displayPath(uipmCsv)} (${layerAStatus.count} product types)${NL}`);
  for (const r of layerA) {
    console.log(`  ▸ ${r.p.type}   [score ${r.score.toFixed(1)} | matched: ${r.hits.join(", ")}]`);
    if (r.p.style) console.log(`      style      : ${r.p.style}`);
    if (r.p.dashboard) console.log(`      dashboard  : ${r.p.dashboard}`);
    if (r.p.landing) console.log(`      landing    : ${r.p.landing}`);
    if (r.p.palette) console.log(`      palette    : ${r.p.palette}`);
    if (r.p.considerations) console.log(`      consider   : ${r.p.considerations}`);
  }
}
console.log();

console.log(`LAYER B — brand-language reference (${index.brands} design systems, ${index.archetypes} archetypes, bundled)${NL}`);
if (!layerB.length) {
  console.log(`  (no reference matched — normal for a genuinely new domain.)${NL}`);
  console.log(`  Fall back to: the product's own existing system > Layer A's style recommendation.`);
} else {
  for (const r of layerB) {
    console.log(`  ▸ ${r.e.id}  (${r.e.kind}, score ${r.score.toFixed(1)})`);
    console.log(`      why  : matched ${r.hits.join(", ") || "facet " + r.facetHit.join(", ")}${r.e.density === "medium-high" ? "; operational-density reference" : ""}${r.e.darkFirst ? "; dark-first" : ""}`);
    console.log(`      read : ${r.e.path}`);
    if (r.e.description) console.log(`      it is : ${r.e.description.slice(0, 180)}${r.e.description.length > 180 ? "…" : ""}`);
  }
  console.log();
  console.log(`  EXTRACT (relationships only): density · type hierarchy · surface strategy · radius family`);
  console.log(`           · colour restraint · navigation character · table/form treatment · icon style`);
  console.log(`  DO NOT COPY: the brand palette, the wordmark or voice, or that product's layout.`);
  console.log(`  NEVER pick a reference because it is fashionable. Pick it because the job matches.`);
}
console.log();

if (uncovered.length) {
  console.log(`COVERAGE GAP — no reference in either layer speaks to: ${uncovered.join(", ")}`);
  console.log(`  This is information, not a failure. Say so in the Design Hypothesis and derive`);
  console.log(`  those decisions from the product context instead of borrowing a fashionable answer.`);
}