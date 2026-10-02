#!/usr/bin/env node
/**
 * build-reference-index.mjs — build data/reference-index.json from bundled data.
 *
 * Reads (all bundled, all license-cleared):
 *   data/brand-systems/<brand>/DESIGN.md        VoltAgent/awesome-design-md, MIT
 *   data/style-archetypes/<archetype>/DESIGN.md  Bergside/awesome-design-skills, MIT
 *
 * The index is a RETRIEVAL structure only. It never loads a reference into
 * context — pick-references.mjs ranks, then the agent reads at most 2-3 files
 * deliberately.
 *
 * Determinism: `generated` is omitted from the file and printed separately, so
 * two builds from the same data produce byte-identical output. Nothing derived
 * from an absolute filesystem path is stored.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { paths } from "../lib/paths.mjs";

/**
 * Domain facets. Each entry maps a facet name to the vocabulary that signals it.
 * A facet exists only if it changes which reference is right.
 */
const FACETS = {
  "fintech-trading": ["trading","exchange","brokerage","order book","stocks","crypto","defi","payments","banking","fintech","investing","futures","liquidity","coinbase","binance","kraken","revolut","wise","mastercard","visa"],
  "healthcare-clinical": ["clinic","patient","medical","appointment","prescription","dental","physician","nurse","triage","ehr","emr","healthcare","therapy","pharmacy","wellness","spa","keva"],
  "b2b-crm-sales": ["crm","sales pipeline","deal","lead","quota","territory","revenue","contract","renewal","forecasting","account executive","salesforce","hubspot","attio"],
  "developer-tool": ["developer","sdk","cli","terminal","engineering","open source","runtime","observability","compiler","framework","api","code","vercel","github","cursor","warp","raycast","supabase","hashicorp","mongodb","clickhouse"],
  "knowledge-research": ["research","knowledge","documentation","wiki","learning","course","academic","archive","writing","publishing","notion","miro","expo","perplexity","reading","notes"],
  "smb-operations": ["smb","small business","field service","dispatch","franchise","logistics","fleet","inventory","point of sale","restaurant","booking","workforce","manufacturing","scheduling","calendly","cal.com"],
  "productivity-saas": ["saas","workspace","collaboration","project management","kanban","admin panel","productivity","automation","asana","linear","airtable","monday","clickup"],
  "consumer-social": ["social","community","feed","creator","messaging","streaming","music","gaming","tiktok","instagram","reddit","pinterest","snapchat","spotify","nintendo","playstation","discord"],
  "ecommerce-retail": ["ecommerce","commerce","shop","store","checkout","cart","marketplace","shipping","apparel","fashion","shopify","nike","airbnb","etsy","amazon","walmart"],
  "marketing-brand": ["marketing","landing page","campaign","brand","launch","waitlist","agency","portfolio","studio","exhibition"],
  "ai-product": ["llm","ai agent","assistant","copilot","chat","inference","prompt","machine learning","generative","openai","anthropic","claude","perplexity","replicate","hugging"],
  "data-dense": ["dashboard","analytics","metrics","real-time","monitoring","observability","console","kpi","telemetry","trading","chart","graph","data visualization"],
  "regulated-trust": ["insurance","compliance","audit","kyc","consent","hipaa","pci","gdpr","sox","banking","legal","government","identity","security","healthcare"],
  "global-enterprise": ["enterprise","suite","cloud","infrastructure","supply chain","erp","global","voltagent","ibm","siemens","verizon","vodafone","att"],
};

const DENSITY_HINTS = ["dashboard","console","table","dense","analytics","monitoring","platform","app","workspace","operational","trading","admin","settings","developer","terminal"];
const DARK_HINTS = ["dark","near-black","#010102","black background","dark theme","dark canvas","dark-first"];

function matchesTerm(hay, term) {
  if (term.includes(" ")) return hay.includes(term);
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(hay);
}

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const km = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (km) out[km[1]] = km[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function readDesignMd(dir, id, kind, source, pathPrefix) {
  const p = join(dir, "DESIGN.md");
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  const fm = frontmatter(text) ?? {};
  const desc = fm.description ?? "";
  const summary = /\n\n([^\n]{40,240})/.exec(text)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const name = fm.name ?? id;

  // Facets match the HEAD only. Matching the whole body makes every reference
  // look like every facet, because marketing pages all mention dashboards.
  const head = `${id} ${name} ${desc} ${summary}`.toLowerCase();
  const facets = Object.entries(FACETS).filter(([, terms]) => terms.some((t) => matchesTerm(head, t))).map(([f]) => f);

  const keywords = new Set();
  for (const w of head.replace(/[^a-z0-9+#.\s-]/gi, " ").toLowerCase().split(/\s+/)) {
    if (w.length >= 3) keywords.add(w);
  }

  return {
    id, kind, name, source,
    description: desc || summary.slice(0, 200),
    facets,
    keywords: [...keywords].sort(),
    density: DENSITY_HINTS.some((t) => matchesTerm(head, t)) ? "medium-high" : "low-medium",
    darkFirst: DARK_HINTS.some((t) => head.includes(t)),
    // Forward-slash relative path: identical on every platform and checkout location.
    path: `${pathPrefix}/${id}/DESIGN.md`,
  };
}

function collect(rootDir, kind, source, pathPrefix, entries, label) {
  if (!existsSync(rootDir)) {
    console.warn(`  ! ${label} not found at ${rootDir} — Layer B will be empty`);
    return;
  }
  const ids = readdirSync(rootDir).sort();
  for (const id of ids) {
    const meta = readDesignMd(join(rootDir, id), id, kind, source, pathPrefix);
    if (meta) entries.push(meta);
  }
  console.log(`  + ${label}: ${ids.length} entries`);
}

const entries = [];
console.log("Building reference index from bundled data…");
collect(join(paths.data, "brand-systems"), "brand-system", "VoltAgent/awesome-design-md", "data/brand-systems", entries, "brand systems");
collect(join(paths.data, "style-archetypes"), "style-archetype", "bergside/awesome-design-skills", "data/style-archetypes", entries, "style archetypes");

// Sorted for determinism: pick-references.mjs does its own scoring, so ordering
// here affects nothing semantically but makes diffs meaningful.
entries.sort((a, b) => a.id.localeCompare(b.id));

const index = {
  schemaVersion: 1,
  count: entries.length,
  brands: entries.filter((e) => e.kind === "brand-system").length,
  archetypes: entries.filter((e) => e.kind === "style-archetype").length,
  facets: Object.keys(FACETS),
  entries,
};
writeFileSync(paths.referenceIndex, JSON.stringify(index, null, 1) + "\n");
console.log(`\nindex: ${index.brands} brand systems + ${index.archetypes} style archetypes = ${index.count} references`);
console.log(`written: ${paths.referenceIndex}`);
if (!entries.length) {
  console.error("\nNo references were indexed — Layer B would be empty. Check data/ is present.");
  process.exit(1);
}