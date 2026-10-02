#!/usr/bin/env node
/**
 * uninstall-agent.mjs — remove a registration made by install-agent.mjs.
 *
 * Removes ONLY what we installed, and only if it is unchanged:
 *   - a symlink we created          → remove the link, never the target
 *   - a copy we created and untouched → remove the copy
 *   - anything the user edited      → leave it, report it, do not delete
 *   - personal eval records         → NEVER removed without an explicit flag
 *
 * Usage:
 *   node scripts/uninstall-agent.mjs --agent pi                # dry run
 *   node scripts/uninstall-agent.mjs --agent pi --apply
 *   node scripts/uninstall-agent.mjs --agent pi --apply --purge-state
 */
import { existsSync, readFileSync, rmSync, lstatSync, realpathSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import { paths, displayPath } from "../lib/paths.mjs";

const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > -1 && !argv[i + 1]?.startsWith("--") ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
const APPLY = has("--apply");
const PURGE = has("--purge-state");
const AGENT = flag("agent", "pi");

const receiptPath = join(paths.receipts, `${AGENT}.json`);
console.log(`\nUNINSTALL — ${AGENT}${APPLY ? "  (APPLYING)" : "  (DRY RUN — nothing will change)"}\n${"-".repeat(60)}`);

if (!existsSync(receiptPath)) {
  console.log(`No install receipt for "${AGENT}" at ${displayPath(receiptPath)}.\n`);
  console.log("This tool only removes registrations it made itself, so nothing was found to do.");
  console.log(`If you installed manually, remove the skill directory yourself:\n`);
  const home = homedir();
  const guess = process.platform === "win32" ? join(home, ".pi", "agent", "skills", "designer") : join(home, ".config", "pi", "agent", "skills", "designer");
  console.log(`  ${displayPath(guess)}\n`);
  process.exit(0);
}

let receipt;
try { receipt = JSON.parse(readFileSync(receiptPath, "utf8")); }
catch (e) { console.error(`receipt unreadable: ${e.message}`); process.exit(1); }

const dest = receipt.destination;
console.log(`receipt        ${displayPath(receiptPath)}`);
console.log(`installed at   ${displayPath(dest)}`);
console.log(`mode           ${receipt.mode}`);
console.log(`installed      ${receipt.installedAt}`);
console.log(`version        ${receipt.sourceVersion}\n`);

if (!existsSync(dest)) {
  console.log("The destination no longer exists. Removing the stale receipt only.");
  if (APPLY) rmSync(receiptPath, { force: true });
  process.exit(0);
}

let action = "none";
let isLink = false;
try { isLink = lstatSync(dest).isSymbolicLink(); } catch {}

// Guard 1: never follow a symlink into the source checkout and delete the source.
if (isLink) {
  let targetReal = "";
  try { targetReal = realpathSync(dest); } catch {}
  if (targetReal) {
    console.log(`link target    ${displayPath(targetReal)}`);
    if (targetReal === realpathSafe(paths.packageRoot)) {
      action = "remove the link only (source checkout is never deleted)";
    } else {
      console.log("\n! This link points somewhere unexpected. Refusing to touch it.");
      console.log(`  expected: ${displayPath(paths.packageRoot)}`);
      process.exit(3);
    }
  }
} else {
  // Guard 2: an edited copy is the user's work now. Do not delete it silently.
  const edited = receipt.mode === "copy" ? hasEdits(dest, receipt.manifest) : true;
  if (edited) {
    console.log("\n! This copy has local modifications. It may contain your own edits.");
    console.log("  Refusing to delete it automatically. Review, then remove it yourself if desired:");
    console.log(`    ${displayPath(dest)}`);
    if (APPLY) console.log("\nLeaving it in place and removing only the receipt.");
    action = "receipt only";
  } else {
    action = "remove the installed copy";
  }
}

function realpathSafe(p) { try { return realpathSync(p); } catch { return p; } }

/**
 * Recompute the manifest of an installed copy. Compared against the manifest
 * recorded at install time — NOT against the source checkout, because the
 * payload is a deliberate subset of the repo. A subset-vs-whole comparison
 * would call every clean install "modified" and uninstall could never work.
 */
function manifestOf(root) {
  const hash = createHash("sha256");
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

function hasEdits(destDir, recorded) {
  if (!recorded?.sha256) return true; // no manifest recorded → cannot prove it is ours
  try {
    const now = manifestOf(destDir);
    return now.sha256 !== recorded.sha256;
  } catch {
    return true;
  }
}

console.log(`\nplanned action: ${action}`);

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to perform it.");
  console.log(PURGE ? "\n--purge-state requested: personal eval records WILL be deleted." : "\nPersonal eval records are kept unless you pass --purge-state.");
  console.log();
  process.exit(0);
}

if (isLink && action.startsWith("remove the link")) {
  rmSync(dest, { force: true });
  console.log("link removed. Source checkout untouched.");
} else if (action === "remove the installed copy") {
  rmSync(dest, { recursive: true, force: true });
  console.log("installed copy removed.");
} else if (action === "receipt only") {
  console.log("copy left in place.");
}
rmSync(receiptPath, { force: true });
console.log("receipt removed.");

if (PURGE) {
  rmSync(paths.evals, { recursive: true, force: true });
  console.log(`personal eval records DELETED: ${displayPath(paths.evals)}`);
} else {
  console.log(`personal eval records kept: ${displayPath(paths.evals)}`);
}
console.log("\nDone.\n");