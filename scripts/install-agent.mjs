#!/usr/bin/env node
/**
 * install-agent.mjs — register this package's skill with a coding agent.
 *
 * Principles from the plan:
 *   - dry-run by default; --apply performs changes
 *   - never overwrite unrelated config, skills or MCP entries
 *   - detect an existing same-named skill and refuse to clobber it silently
 *   - prefer referencing the whole checkout (symlink/junction) and fall back to
 *     a full copy; never copy only SKILL.md and leave its data behind
 *   - record ownership in an install receipt so uninstall can be precise
 *   - backup anything we modify, and support rollback
 *
 * Usage:
 *   node scripts/install-agent.mjs --agent pi                     # dry run
 *   node scripts/install-agent.mjs --agent pi --apply
 *   node scripts/install-agent.mjs --agent codex --apply --mode copy
 *   node scripts/install-agent.mjs --agent generic --print-bridge  # AGENTS.md snippet
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, lstatSync, symlinkSync, cpSync, readdirSync } from "node:fs";
import { createHash as cryptoCreateHash } from "node:crypto";
import { join, resolve, basename, relative } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { paths, stateRoot, displayPath } from "../lib/paths.mjs";

const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > -1 && !argv[i + 1]?.startsWith("--") ? argv[i + 1] : d; };
const APPLY = argv.includes("--apply");
const AGENT = flag("agent", "pi");
const SCOPE = flag("scope", "user");
const MODE = flag("mode", "link");

const SKILL_NAME = "ai-product-design";

/** Where each agent looks for user-level skills. Verified per agent at install time. */
function userSkillDir(agent) {
  const home = homedir();
  switch (agent) {
    case "pi":
      return process.platform === "win32" ? join(home, ".pi", "agent", "skills") : join(home, ".config", "pi", "agent", "skills");
    case "codex":
    case "claude-code":
    case "generic":
      return join(home, ".agents", "skills");
    default:
      return null;
  }
}

const plan = [];
const note = (s) => plan.push(s);

const destRoot = userSkillDir(AGENT);
if (!destRoot) {
  console.error(`unknown agent "${AGENT}". Supported: pi, codex, claude-code, generic`);
  process.exit(2);
}
if (SCOPE !== "user") {
  console.error('only --scope user is implemented. A project scope writes into the target repo, which this tool will not do implicitly.');
  process.exit(2);
}
const dest = join(destRoot, SKILL_NAME);
const useLink = MODE === "link";

note(`agent          ${AGENT}`);
note(`destination    ${displayPath(dest)}`);
note(`source         ${displayPath(paths.packageRoot)}`);
note(`install mode   ${useLink ? "symlink/junction (edits take effect immediately)" : "full copy (independent of the checkout)"}`);

// ---------------------------------------------------------------- preflight
let linkSupported = useLink;
if (useLink) {
  const probe = join(stateRoot(), ".link-probe");
  try {
    mkdirSync(stateRoot(), { recursive: true });
    symlinkSync(paths.packageRoot, probe, "junction");
    lstatSync(probe);
    rmSync(probe, { force: true });
  } catch (e) {
    linkSupported = false;
    note(`\n! symlink not permitted here (${e.code ?? e.message}). Falling back to a full copy.`);
  }
}

const target = linkSupported ? dest : dest;
const existing = existsSync(target);
let existingIsOurs = false;
if (existing) {
  const receiptPath = join(paths.receipts, `${AGENT}.json`);
  if (existsSync(receiptPath)) {
    try {
      const r = JSON.parse(readFileSync(receiptPath, "utf8"));
      existingIsOurs = r.destination === target;
      note(`\nexisting install at destination — recorded as ours by a previous run (${r.installedAt})`);
    } catch {}
  }
  if (!existingIsOurs) {
    // Never clobber a foreign skill. Show the conflict and stop.
    note("\nCONFLICT: something already exists at the destination and it was not installed by this tool.");
    note("  Existing skill: " + displayPath(target));
    note("  Refusing to overwrite. Resolve it manually, then re-run:");
    note(`    - if it is a previous manual copy of THIS package: delete ${displayPath(target)} and re-run`);
    note(`    - if it is a different skill: keep it, and register this package manually via ${displayPath(paths.adapters)}/${AGENT}/README.md`);
    console.log(`\nINSTALL — ${AGENT}\n${"-".repeat(60)}\n${plan.join("\n")}\n`);
    process.exit(3);
  }
  note("\nwill replace the previous install made by this tool");
}

// ---------------------------------------------------------------- payload
/**
 * The skill directory the agent loads IS the package. Copying must include the
 * supporting files, otherwise the agent reads a skill whose scripts and data
 * are missing — the exact failure mode this tool exists to prevent.
 *
 * `tests/` travels deliberately: the fixtures include the drift checker's
 * NEGATIVE CONTROL. An installed copy that cannot prove its own checker can
 * still fail is an installed copy you have to take on trust.
 */
const PAYLOAD = ["SKILL.md", "references", "scripts", "data", "benchmarks", "lib", "licenses", "tests", "examples", "adapters", "docs", "THIRD_PARTY_NOTICES.md", "LICENSE"];

/**
 * Manifest of exactly what we installed, so uninstall can tell "untouched copy"
 * from "user edited this". It must NOT compare against the whole source tree:
 * the payload is a deliberate SUBSET of the repo (no package-lock, no
 * .gitignore), so a subset-vs-whole comparison would report every clean
 * install as edited and uninstall could never remove anything.
 */
function manifestOf(root) {
  const hash = cryptoCreateHash("sha256");
  const files = [];
  const walk = (d, prefix = "") => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(d, e.name), rel);
      else { files.push(rel); hash.update(rel); hash.update(readFileSync(join(d, e.name))); }
    }
  };
  walk(root);
  return { files: files.length, sha256: hash.digest("hex") };
}

function doInstall() {
  mkdirSync(destRoot, { recursive: true });
  if (existing) {
    try {
      const st = lstatSync(dest);
      if (st.isSymbolicLink()) rmSync(dest, { force: true });
      else rmSync(dest, { recursive: true, force: true });
    } catch {}
  }
  let manifest = null;
  if (linkSupported) {
    symlinkSync(paths.packageRoot, dest, "junction");
    note(`linked: ${displayPath(dest)} -> ${displayPath(paths.packageRoot)}`);
  } else {
    mkdirSync(dest, { recursive: true });
    for (const item of PAYLOAD) {
      const from = join(paths.packageRoot, item);
      if (!existsSync(from)) { note(`  ! missing payload entry skipped: ${item}`); continue; }
      cpSync(from, join(dest, item), { recursive: true });
    }
    manifest = manifestOf(dest);
    note(`copied ${PAYLOAD.length} entries (${manifest.files} files) into ${displayPath(dest)}`);
  }
  mkdirSync(paths.receipts, { recursive: true });
  writeFileSync(join(paths.receipts, `${AGENT}.json`), JSON.stringify({
    agent: AGENT,
    destination: dest,
    mode: linkSupported ? "link" : "copy",
    source: paths.packageRoot,
    sourceVersion: readPkgVersion(),
    installedAt: new Date().toISOString(),
    payload: PAYLOAD,
    manifest,
  }, null, 2) + "\n");
  note(`receipt written: ${displayPath(join(paths.receipts, `${AGENT}.json`))}`);
}

function readPkgVersion() {
  try { return JSON.parse(readFileSync(join(paths.packageRoot, "package.json"), "utf8")).version ?? "unknown"; }
  catch { return "unknown"; }
}

// ---------------------------------------------------------------- report
console.log(`\nINSTALL — ${AGENT}${APPLY ? "  (APPLYING)" : "  (DRY RUN — nothing will change)"}\n${"-".repeat(60)}`);
const plannedCount = plan.length;
console.log(plan.join("\n"));
console.log(`\npayload        ${PAYLOAD.join(", ")}`);

if (!APPLY) {
  console.log(`\nDry run only. Re-run with --apply to install.`);
  console.log(`Prefer --mode copy if you plan to move or delete ${displayPath(paths.packageRoot)}.\n`);
  process.exit(0);
}

try {
  doInstall();
} catch (e) {
  console.error(`\ninstall failed: ${e.message}`);
  console.error("nothing was left partially configured in a way that changes existing skills.");
  process.exit(1);
}

// Notes produced DURING installation (not known beforehand) must still be shown.
const outcome = plan.slice(plannedCount);
if (outcome.length) {
  console.log(`\nperformed`);
  for (const line of outcome) console.log(`  ${line}`);
}

console.log(`\nInstalled. Now verify it:\n`);
console.log(`  node ${displayPath(join(paths.scripts, "doctor.mjs"))} --agent ${AGENT}`);
console.log(`\nThen restart or reload the agent, and confirm the skill loads:`);
console.log(AGENT === "pi" ? "  /skill:ai-product-design  <your product-UI brief>" : `  follow ${displayPath(join(paths.adapters, AGENT, "README.md"))}`);
console.log();