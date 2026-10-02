#!/usr/bin/env node
/**
 * run-benchmark.mjs — run one benchmark brief and score the result on the six
 * dimensions, so a change to the system (or the model) can be compared against the
 * previous version using identical input.
 *
 *   node run-benchmark.mjs list
 *   node run-benchmark.mjs 01 --out runs/<timestamp>
 *   node run-benchmark.mjs 01 --compare runs/<a> --vs runs/<b>
 *
 * This does not design anything. It captures the brief, records where the work
 * happened, and emits a comparable report skeleton. The judgement is still made by
 * a human (or a reviewer pass with `references/design-review.md`).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > -1 ? argv[i + 1] : d; };

const DIMENSIONS = [
  ["product-reasoning", "Does it understand the user's job, frequency, and stakes?"],
  ["user-flow", "Can the primary outcome be completed clearly and efficiently?"],
  ["information-architecture", "Are entities, hierarchy and navigation right?"],
  ["typography", "Constrained hierarchy, legible at the target density?"],
  ["color", "Coherent and restrained; semantic roles; measured contrast?"],
  ["geometry", "One radius family; pills justified; nesting coherent?"],
  ["spacing", "One scale; relationships consistent across screens?"],
  ["density", "One density expressed everywhere?"],
  ["component-structure", "Reused, not duplicated; cards earned; states complete?"],
  ["visual-coherence", "Do the screens look like one product and one person?"],
  ["perceived-craft", "Alignment, rhythm, proportion, restraint, no AI tells?"],
  ["responsiveness", "Designed for each breakpoint, not shrunk?"],
];

if (argv[0] === "list" || !argv[0]) {
  for (const f of readdirSync(HERE).filter((f) => f.endsWith(".md")).sort()) {
    const t = readFileSync(join(HERE, f), "utf8").split("\n")[0].replace(/^#\s*/, "");
    console.log(`${f.replace(/\.md$/, "").padEnd(4)} ${t}`);
  }
  process.exit(0);
}

const id = argv[0];
const briefFile = readdirSync(HERE).find((f) => f.startsWith(id) && f.endsWith(".md") && f !== "run-benchmark.mjs");
if (!briefFile) { console.error(`no benchmark matching "${argv[0]}" — run with: list`); process.exit(2); }
const brief = readFileSync(join(HERE, briefFile), "utf8");
const outDir = flag("out", join("runs", new Date().toISOString().replace(/[:.]/g, "-")));
mkdirSync(outDir, { recursive: true });

const compareTo = flag("compare");
if (compareTo) {
  if (!existsSync(compareTo)) { console.error(`no previous run at ${compareTo}`); process.exit(2); }
  const a = JSON.parse(readFileSync(join(compareTo, "run.json"), "utf8"));
  const b = JSON.parse(readFileSync(join(flag("vs") ?? ".", "run.json"), "utf8"));
  console.log(`dimension${" ".repeat(18)}${a.id}   ${b.id}   delta`);
  let aSum = 0, bSum = 0;
  for (const [dim] of DIMENSIONS) {
    const av = a.scores?.[dim] ?? "-", bv = b.scores?.[dim] ?? "-";
    if (typeof av === "number") aSum += av;
    if (typeof bv === "number") bSum += bv;
    const d = typeof av === "number" && typeof bv === "number" ? (bv - av > 0 ? `+${bv - av}` : `${bv - av}`) : "";
    console.log(`${dim.padEnd(24)}${String(av).padEnd(6)}${String(bv).padEnd(6)}${d}`);
  }
  console.log(`\n${"TOTAL".padEnd(24)}${aSum}${bSum ? `  ${bSum > aSum ? "+" : ""}${bSum - aSum}` : ""}`);
  console.log(`\nCompare judgement, not pixels. A higher score with a different visual identity can`);
  console.log(`still be the better design — the dimensions above are the things that matter.`);
  process.exit(0);
}

const run = {
  id: briefFile.replace(/\.md$/, ""),
  started: new Date().toISOString(),
  system: flag("system", "ai-product-design v1.0"),
  model: flag("model", "(record the model id)"),
  brief: briefFile,
  outDir,
  scores: Object.fromEntries(DIMENSIONS.map(([d]) => [d, null])),
  notes: "",
};
writeFileSync(join(outDir, "brief.md"), brief);
writeFileSync(join(outDir, "run.json"), JSON.stringify(run, null, 2));

const scorecard = [
  `# Run — ${run.id}`,
  "",
  `- system: ${run.system}`,
  `- model: ${run.model}`,
  `- started: ${run.started}`,
  "",
  "## Verdict",
  "",
  `_Ship / Ship with fixes / Needs work — one line._`,
  "",
  "## Scores (0–5)",
  "",
  "| Dimension | Score | Evidence (a screenshot, a measurement, a quote — not a feeling) |",
  "|---|---|---|",
  ...DIMENSIONS.map(([d, q]) => `| ${d} | ? | ${q} |`),
  "",
  "## Hypothesis written before implementation",
  "",
  "_(paste the design hypothesis — required, an empty one means the run is not comparable)_",
  "",
  "## References selected and why",
  "",
  "## What the review found, classified",
  "",
  "| Finding | Class (LOCAL/COMPONENT/DESIGN-SYSTEM/DIRECTION) | Fixed at |",
  "|---|---|---|",
  "",
  "## Design-drift result",
  "",
  "## Notes",
  "",
].join("\n");
writeFileSync(join(outDir, "scorecard.md"), scorecard);

console.log(`run scaffolded at ${outDir}`);
console.log(`  brief.md     the fixed brief (identical across versions)`);
console.log(`  run.json     metadata + scores`);
console.log(`  scorecard.md the 12-dimension rubric\n`);
console.log(`Next: build it, review it with references/design-review.md, fill in the scorecard.`);
console.log(`Then:  node run-benchmark.mjs ${argv[0]} --compare ${outDir} --vs <previous-run>`);
