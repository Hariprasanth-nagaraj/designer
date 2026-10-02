#!/usr/bin/env node
/**
 * record.mjs — design eval / taste store.
 *
 * The accumulated taste layer. Not an ML system: just structured, retrievable records
 * of what was approved, what was rejected, and why. Retrieved selectively before a
 * design task — never loaded wholesale.
 *
 *   node record.mjs approve --project bullion-console --tier 4 \
 *     --hypothesis "high-density operations console, borders over shadows, scarce gold" \
 *     --references "kraken (density/surface), linear.app (type hierarchy, restraint)" \
 *     --what-worked "tabular numerals, hairline surface ladder, P&L sign+colour pairing" \
 *     --why "user recognised the domain instantly; zero review comments on density"
 *
 *   node record.mjs reject --project clinic-portal \
 *     --why "generic AI SaaS: every section a rounded card, purple gradient hero, pill filters" \
 *     --tropes "excessive-cards,gradient,pill-heavy,marketing-title" \
 *     --fix "return to the hypothesis; re-derive surfaces from spacing + borders"
 *
 *   node record.mjs list
 *   node record.mjs retrieve "high density trading console"   # what applies to this task
 *   node record.mjs tropes                                     # recurring failure signals
 *   node record.mjs --where                                    # show resolved locations
 *
 * STORAGE: approved/rejected records are PERSONAL STATE and live outside the
 * checkout (see lib/paths.mjs). Updating or deleting the repo never destroys a
 * user's design history, and the package can never contain someone else's
 * records. Override with AI_PRODUCT_DESIGN_STATE=<dir>.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { paths, displayPath } from "../lib/paths.mjs";

const APPROVED = join(paths.evals, "approved");
const REJECTED = join(paths.evals, "rejected");
const BENCH = paths.benchmarks;
const EXAMPLES = join(paths.packageRoot, "examples", "evals");

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, def = null) => {
  const i = argv.indexOf(`--${name}`);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
};
const flagAll = (name) => argv.reduce((a, v, i) => (v === `--${name}` && argv[i + 1] ? [...a, argv[i + 1]] : a), []);

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const stamp = () => new Date().toISOString().slice(0, 10);

function write(dir, project, rec) {
  mkdirSync(dir, { recursive: true });
  const name = `${stamp()}-${slug(project)}${existsSync(join(dir, `${stamp()}-${slug(project)}.md`)) ? "-2" : ""}.md`;
  const path = join(dir, name);
  writeFileSync(path, rec);
  return path;
}

const asList = (s) => (s ? s.split(/\s*[,;]\s*/).filter(Boolean) : []);

if (cmd === "approve" || cmd === "reject") {
  const project = flag("project");
  if (!project) { console.error("--project is required"); process.exit(2); }

  const rec = [
    `# ${cmd === "approve" ? "Approved" : "Rejected"} — ${project}`,
    "",
    `- **date**: ${stamp()}`,
    `- **tier**: ${flag("tier", "?")}`,
    `- **surface / scope**: ${flag("surface", "(not recorded)")}`,
  ].join("\n");

  if (cmd === "approve") {
    const body = [
      "",
      "## Design hypothesis", "", flag("hypothesis", "(not recorded)"), "",
      "## References used — and why each was relevant", "", flag("references", "(none recorded)"), "",
      "## What worked — keep this", "", flag("what-worked", "(not recorded)"), "",
      "## System decisions that earned their keep", "", flag("decisions", "(not recorded)"), "",
      "## Why this is worth reusing", "", flag("why", "(not recorded)"), "",
      `<!-- tags: ${asList(flag("tags")).concat(asList(flag("density")), asList(flag("domain"))).join(", ")} -->`,
    ].join("\n");
    console.log("wrote", write(APPROVED, project, rec + body));
  } else {
    const body = [
      "",
      "## Why it was rejected", "", flag("why", "(not recorded)"), "",
      "## Failure signals", "", asList(flag("tropes")).map((t) => `- \`${t}\``).join("\n") || "(none tagged)", "",
      "## The correct move instead", "", flag("fix", "(not recorded)"), "",
      `<!-- tags: ${[...asList(flag("tropes")), ...asList(flag("tags"))].join(", ")} -->`,
    ].join("\n");
    console.log("wrote", write(REJECTED, project, rec + body));
  }
  process.exit(0);
}

function collect(dir, label) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const raw = readFileSync(join(dir, f), "utf8");
    const tags = (raw.match(/<!-- tags: (.*?) -->/)?.[1] ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    const heading = raw.split("\n")[0].replace(/^#\s*/, "");
    return { file: f, dir: label, heading, tags, body: raw, words: raw.toLowerCase().split(/\W+/).filter((w) => w.length > 3) };
  });
}

/**
 * Examples ship with the package to demonstrate the format. They are clearly
 * labelled and listed separately, so a user never mistakes a sample for their
 * own recorded judgment.
 */
const collectAll = (dir, label) => [...collect(dir, label), ...collect(EXAMPLES, "example")];

if (cmd === "list" || !cmd) {
  for (const [label, dir] of [["APPROVED", APPROVED], ["REJECTED", REJECTED], ["BENCHMARKS", BENCH]]) {
    const items = collect(dir, label.toLowerCase());
    console.log(`\n${label} (${items.length})  ${displayPath(dir)}`);
    for (const i of items) console.log(`  ${i.file.padEnd(52)} ${i.heading}`);
  }
  const ex = collect(EXAMPLES, "example");
  if (ex.length) {
    console.log(`\nSHIPPED EXAMPLES (${ex.length})  ${displayPath(EXAMPLES)}`);
    for (const i of ex) console.log(`  ${i.file.padEnd(52)} ${i.heading}`);
    console.log("\n  Examples demonstrate the format only — they are not your recorded judgment.");
  }
  console.log();
  process.exit(0);
}

if (cmd === "--where") {
  console.log("Resolved locations\n");
  console.log(`  package root : ${displayPath(paths.packageRoot)}`);
  console.log(`  state root   : ${displayPath(paths.stateRoot)}`);
  console.log(`  approved     : ${displayPath(APPROVED)}`);
  console.log(`  rejected     : ${displayPath(REJECTED)}`);
  console.log(`  benchmarks   : ${displayPath(BENCH)}`);
  console.log(`  examples     : ${displayPath(EXAMPLES)}`);
  console.log("\nRecords are personal state and are never written inside the checkout.");
  process.exit(0);
}

if (cmd === "tropes") {
  const counts = new Map();
  for (const r of collectAll(REJECTED, "rejected")) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!rows.length) { console.log("no tagged rejections yet."); process.exit(0); }
  console.log("Recurring failure signals — if one of these shows up twice, it is a system problem, not a screen problem.\n");
  for (const [t, n] of rows) console.log(`  ${String(n).padStart(2)}×  ${t}`);
  console.log();
  process.exit(0);
}

if (cmd === "retrieve") {
  const q = argv.slice(1).join(" ").toLowerCase();
  const terms = q.split(/\W+/).filter((w) => w.length > 3);
  if (!terms.length) { console.error('usage: record.mjs retrieve "<task description>"'); process.exit(2); }
  const scored = [...collectAll(APPROVED, "approved"), ...collectAll(REJECTED, "rejected")]
    .map((r) => ({ r, score: terms.reduce((a, t) => a + (r.words.includes(t) ? 1 : 0) + r.tags.filter((x) => x.includes(t)).length * 2, 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  if (!scored.length) { console.log("No recorded preference applies to this task. Proceed from the product context."); process.exit(0); }
  console.log(`Preference records that apply to "${argv.slice(1).join(" ")}"\n`);
  for (const { r, score } of scored) {
    console.log(`── ${r.dir}/${r.file}  [relevance ${score}]`);
    console.log(r.body.split("\n").slice(0, 14).map((l) => "   " + l).join("\n").trim());
    console.log();
  }
  process.exit(0);
}

console.error('Usage: record.mjs approve|reject|list|retrieve|tropes');
process.exit(2);
