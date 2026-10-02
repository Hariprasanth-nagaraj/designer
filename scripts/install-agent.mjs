#!/usr/bin/env node
/**
 * install-agent.mjs — register this package's skill with a coding agent.
 *
 * npm install -g puts the TOOLS on your PATH. It deliberately does NOT touch
 * your agent: only the agent's owner knows where its skills live, and an
 * install script that silently edits your editor config is how setups break.
 * This command is that deliberate step.
 *
 *   designer-install-agent --list                 # show the registry
 *   designer-install-agent                        # detect what's installed
 *   designer-install-agent --ai pi --apply        # install for one agent
 *   designer-install-agent --ai all --apply       # install everywhere detected
 *   designer-install-agent --ai claude --scope project --apply
 *
 * Principles:
 *   - dry run by default; --apply performs changes
 *   - never overwrite a skill this tool did not create
 *   - ship the WHOLE package; a skill whose scripts are missing is broken
 *   - record a manifest so uninstall can tell "untouched" from "user edited"
 *   - keep personal eval records out of the repo, always
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, lstatSync, symlinkSync, cpSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, relative } from "node:path";
import { homedir } from "node:os";
import { paths, stateRoot, displayPath } from "../lib/paths.mjs";

const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > -1 && !argv[i + 1]?.startsWith("--") ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);

const APPLY = has("--apply");
const AGENT = flag("ai") ?? flag("agent", null);
const SCOPE = flag("scope", "user");
const MODE = flag("mode", "link");

const SKILL_NAME = "designer";
const REGISTRY = JSON.parse(readFileSync(join(paths.data, "agents.json"), "utf8"));

// ---------------------------------------------------------------- paths
function expand(p) {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return join(homedir(), p.slice(2));
  return resolve(p);
}

function loadRegistry() {
  return REGISTRY.agents;
}

/** Skills dir for an agent at the requested scope. */
function dirFor(agent, scope) {
  if (scope === "project") {
    const p = agent.projectDirs?.[0];
    return p ? resolve(process.cwd(), p) : null;
  }
  const p = agent.dirs?.[0];
  return p ? expand(p) : null;
}

/** Is this agent actually installed on this machine? */
function detected(agent) {
  return (agent.detect ?? []).some((d) => existsSync(expand(d)));
}

const registry = loadRegistry();
const known = registry.find((a) => a.id === AGENT || a.label.toLowerCase() === String(AGENT ?? "").toLowerCase());

// ---------------------------------------------------------------- --list
if (has("--list")) {
  console.log("\nAgent registry\n" + "=".repeat(64));
  const detectedList = registry.filter(detected);
  console.log(`detected on this machine: ${detectedList.length ? detectedList.map((a) => a.id).join(", ") : "none"}\n`);
  for (const a of registry) {
    const mark = detected(a) ? "✓" : " ";
    const tag = a.confidence === "verified" ? "verified" : "unverified";
    console.log(`  ${mark} ${a.id.padEnd(12)} ${a.label.padEnd(30)} ${displayPath(dirFor(a, "user") ?? "?")}  [${tag}]`);
  }
  console.log(`\nInstall with:  designer-install-agent --ai <id> --apply`);
  console.log(`Registry file: ${displayPath(join(paths.data, "agents.json"))}  (add your own agent here)`);
  console.log();
  process.exit(0);
}

// ---------------------------------------------------------------- resolve target
if (AGENT && AGENT !== "all" && !known) {
  console.error(`unknown agent "${AGENT}". Run --list to see supported ids.`);
  process.exit(2);
}
if (SCOPE !== "user" && SCOPE !== "project") {
  console.error('--scope must be "user" or "project"');
  process.exit(2);
}

const targets = AGENT === "all"
  ? registry.filter((a) => detected(a)).map((a) => ({ agent: a, dir: dirFor(a, SCOPE) })).filter((t) => t.dir)
  : known ? [{ agent: known, dir: dirFor(known, SCOPE) }] : [];

if (!targets.length) {
  if (AGENT === "all") {
    console.log("\nNo supported agents were detected on this machine.\n");
    console.log("Install one, or point at it directly:");
    console.log(`  designer-install-agent --ai universal --apply      # the cross-vendor standard location`);
    console.log(`  designer-install-agent --list                      # see all ${registry.length} known agents`);
    console.log(`\nDetected markers were checked in: ~/.pi ~/.claude ~/.codex ~/.agents ~/.cursor`);
    console.log(`and each agent's own config directory.\n`);
    process.exit(0);
  }
  console.error(`"${AGENT}" has no skills directory configured for --scope ${SCOPE}.`);
  console.error("Run --list, or use the manual bridge in adapters/generic/README.md");
  process.exit(2);
}

// ---------------------------------------------------------------- payload
/**
 * `tests/` travels deliberately: it contains the drift checker's NEGATIVE
 * CONTROL. An installed copy that cannot prove its own checker still fails is
 * an installed copy you have to take on trust.
 */
const PAYLOAD = ["SKILL.md", "references", "scripts", "data", "benchmarks", "lib", "licenses", "tests", "examples", "adapters", "docs", "THIRD_PARTY_NOTICES.md", "LICENSE"];

/**
 * Manifest of exactly what we installed. Compared on uninstall against this
 * record — NOT against the source tree, because the payload is a deliberate
 * subset of the repo. A subset-vs-whole comparison would call every clean
 * install "modified" and uninstall could never remove anything.
 */
function manifestOf(root) {
  const hash = createHash("sha256");
  let n = 0;
  const walk = (d, prefix = "") => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(d, e.name), rel);
      else { n++; hash.update(rel); hash.update(readFileSync(join(d, e.name))); }
    }
  };
  walk(root);
  return { files: n, sha256: hash.digest("hex") };
}

// ---------------------------------------------------------------- plan
const dests = [];
for (const { agent, dir } of targets) {
  const dest = join(dir, SKILL_NAME);
  const receiptPath = join(paths.receipts, `${agent.id}.json`);
  let ours = false;
  if (existsSync(receiptPath)) {
    try { ours = JSON.parse(readFileSync(receiptPath, "utf8")).destination === dest; } catch {}
  }
  const exists = existsSync(dest);
  dests.push({ agent, dir, dest, receiptPath, ours, exists, blocked: exists && !ours });
}

const conflicted = dests.filter((d) => d.blocked);

console.log(`\nDESIGNER — install skill for ${AGENT ?? "detected agents"}${SCOPE === "project" ? ` (project scope: ${displayPath(process.cwd())})` : ""}${APPLY ? "  APPLYING" : "  DRY RUN — nothing will change"}\n` + "=".repeat(64));
for (const d of dests) {
  const flagMark = d.blocked ? "✗ CONFLICT" : d.exists ? "↻ replace" : "→ install";
  console.log(`  ${flagMark.padEnd(11)} ${d.agent.label.padEnd(30)} ${displayPath(d.dest)}`);
  if (d.agent.notes) console.log(`               ${d.agent.notes}`);
  if (d.blocked) console.log(`               a skill already exists here and was NOT installed by this tool.`);
}
if (!APPLY) {
  console.log(`\npayload ${PAYLOAD.length} entries, mode: ${MODE === "link" ? "symlink (edits apply live)" : "copy (independent)"}`);
  console.log("Dry run. Re-run with --apply.");
  console.log();
  process.exit(0);
}

if (conflicted.length) {
  console.error(`\nRefusing to overwrite ${conflicted.length} pre-existing skill(s). Resolve them, then re-run.`);
  process.exit(3);
}

// ---------------------------------------------------------------- do it
mkdirSync(paths.receipts, { recursive: true });
for (const d of dests) {
  try {
    if (d.exists) {
      const st = lstatSync(d.dest);
      if (st.isSymbolicLink()) rmSync(d.dest, { force: true });
      else rmSync(d.dest, { recursive: true, force: true });
    }
    let mode = "copy";
    let manifest = null;
    if (MODE === "link") {
      try {
        mkdirSync(d.dir, { recursive: true });
        symlinkSync(paths.packageRoot, d.dest, "junction");
        mode = "link";
      } catch {
        mode = "copy"; // no symlink permission — fall back silently but correctly
      }
    }
    if (mode === "copy") {
      mkdirSync(d.dest, { recursive: true });
      for (const item of PAYLOAD) {
        const from = join(paths.packageRoot, item);
        if (existsSync(from)) cpSync(from, join(d.dest, item), { recursive: true });
      }
      manifest = manifestOf(d.dest);
    }
    writeFileSync(d.receiptPath, JSON.stringify({
      agent: d.agent.id, destination: d.dest, mode, source: paths.packageRoot,
      sourceVersion: JSON.parse(readFileSync(join(paths.packageRoot, "package.json"), "utf8")).version,
      installedAt: new Date().toISOString(), payload: PAYLOAD, manifest,
    }, null, 2) + "\n");
    console.log(`  ✓ ${d.agent.label.padEnd(28)} ${mode === "link" ? "linked" : `copied ${manifest.files} files`}`);
  } catch (e) {
    console.error(`  ✗ ${d.agent.label}: ${e.message}`);
    process.exitCode = 1;
  }
}

console.log(`\nInstalled. Next:`);
console.log(`  designer-doctor --agent ${dests[0].agent.id}`);
console.log("\nRestart or reload the agent, then:");
console.log("  /designer  Design an approval workflow screen for finance operators.");
console.log("\nIf the agent does not pick it up, use the manual bridge instead:");
console.log(`  Read ${displayPath(join(paths.packageRoot, "SKILL.md"))} and follow it for this task.`);
console.log();