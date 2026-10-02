#!/usr/bin/env node
/**
 * setup.mjs — profile-based environment setup.
 *
 * Safe by default: prints what it would do, changes nothing unless you pass
 * --apply. Never installs privileged system packages, never runs npx install
 * without telling you, never overwrites your MCP config.
 *
 * Profiles:
 *   core     no browser. Static checks, reference selection, evals, reasoning.
 *   browser  core + Playwright library + Chromium binary. Enables audit + flow tests.
 *   full     browser + optional knowledge packs (external, opt-in per pack).
 *
 * Usage:
 *   node scripts/setup.mjs --profile browser            # dry run, prints the plan
 *   node scripts/setup.mjs --profile browser --apply
 *   node scripts/setup.mjs --profile full --apply --packs ui-ux-pro-max,baoyu-design
 *   node scripts/setup.mjs --check-reuse                # report compatible existing tooling
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { paths, stateRoot, findPack, displayPath } from "../lib/paths.mjs";

const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > -1 && !argv[i + 1]?.startsWith("--") ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);

const APPLY = has("--apply");
const PROFILE = flag("profile", "core");
const PACKS = (flag("packs", "") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

if (!["core", "browser", "full"].includes(PROFILE)) {
  console.error(`unknown profile "${PROFILE}" — expected core | browser | full`);
  process.exit(2);
}
if (PACKS.some((p) => !["ui-ux-pro-max", "baoyu-design"].includes(p))) {
  console.error("unknown pack. Available external packs: ui-ux-pro-max, baoyu-design");
  process.exit(2);
}
if (PROFILE === "full" && PACKS.length === 0) {
  console.log("Note: profile 'full' adds no packs by default.");
  console.log("      Pass --packs ui-ux-pro-max,baoyu-design to opt in explicitly.");
  console.log("      These are EXTERNAL skills with no redistributable licence found, so this");
  console.log("      package does not bundle them. Installing is your choice and your step.\n");
}

const steps = [];
const step = (name, why, fn) => steps.push({ name, why, fn });

// ---------------------------------------------------------------- reuse detection
function detectExisting() {
  const found = [];
  // A globally/locally available playwright the scripts can use already.
  try {
    const r = spawnSync(process.execPath, ["-e", "console.log(require.resolve('playwright'))"], { encoding: "utf8", timeout: 20000 });
    if (r.status === 0 && r.stdout.trim()) found.push({ what: "playwright", where: r.stdout.trim().trim(), kind: "resolvable module" });
  } catch {}
  const localPw = join(paths.packageRoot, "node_modules", "playwright");
  if (existsSync(localPw)) found.push({ what: "playwright", where: localPw, kind: "package-local" });
  for (const pack of ["ui-ux-pro-max", "baoyu-design"]) {
    const at = findPack(pack);
    if (at) found.push({ what: pack, where: at, kind: "external pack" });
  }
  return found;
}

if (has("--check-reuse")) {
  const found = detectExisting();
  console.log("\nExisting compatible tooling detected\n");
  if (!found.length) console.log("  (none found — a clean install is required)");
  for (const f of found) console.log(`  + ${f.what.padEnd(16)} ${f.kind.padEnd(18)} ${displayPath(f.where)}`);
  console.log("\nReusing existing tooling is safe. Setup will not touch anything it did not install.\n");
  process.exit(0);
}

// ---------------------------------------------------------------- steps
step("verify Node runtime",
  "Node 20+ is required by every script in this package.",
  () => {
    const major = Number(process.versions.node.split(".")[0]);
    return { ok: major >= 20, detail: `Node ${process.versions.node}` };
  });

step("build the reference index",
  "Layer B retrieval needs an index built from the bundled data. Rebuilding is deterministic.",
  () => {
    const r = spawnSync(process.execPath, [join(paths.scripts, "build-reference-index.mjs")], { encoding: "utf8", timeout: 120000 });
    return { ok: r.status === 0, detail: (r.stdout ?? r.stderr ?? "").trim().split("\n").slice(-2).join(" ") };
  });

step("create the personal state directory",
  "Eval records and install receipts live OUTSIDE the checkout so updating or deleting the repo never destroys your design history.",
  () => {
    if (APPLY) { mkdirSync(paths.evals, { recursive: true }); mkdirSync(paths.receipts, { recursive: true }); }
    return { ok: true, detail: displayPath(stateRoot()) };
  });

step("run drift self-test",
  "Proves the checker passes a clean fixture AND still rejects a known-bad one. A checker that cannot fail is worse than none.",
  () => {
    const clean = spawnSync(process.execPath, [join(paths.scripts, "design-drift.mjs"), join(paths.packageRoot, "tests", "fixtures", "drift-ok")], { encoding: "utf8", timeout: 60000 });
    const bad = spawnSync(process.execPath, [join(paths.scripts, "design-drift.mjs"), join(paths.packageRoot, "tests", "fixtures", "drift-bad")], { encoding: "utf8", timeout: 60000 });
    return {
      ok: clean.status === 0 && bad.status !== 0,
      detail: clean.status === 0 && bad.status !== 0 ? "clean fixture passes, negative control rejected" : `PROBLEM clean=${clean.status} bad=${bad.status}`,
    };
  });

if (PROFILE !== "core") {
  step("install Playwright (Node library)",
    "Required for the deterministic browser audit and scripted flow tests. Pinned by package-lock.json.",
    () => {
      if (!APPLY) return { ok: true, skipped: true, detail: `would run: npm ci` };
      const r = spawnSync("npm", ["ci"], { cwd: paths.packageRoot, encoding: "utf8", timeout: 600000, shell: process.platform === "win32" });
      return { ok: r.status === 0, detail: r.status === 0 ? "installed" : (r.stderr ?? "").trim().split("\n").slice(0, 3).join(" ") };
    });

  step("download the Chromium binary",
    "Playwright needs its own browser build. ~150 MB. Some Linux systems also need system libraries (see docs/installation.md).",
    () => {
      if (!existsSync(join(paths.packageRoot, "node_modules", "playwright"))) return { ok: false, skipped: true, detail: "deferred: Playwright library not installed yet" };
      if (!APPLY) return { ok: true, skipped: true, detail: "would run: npx playwright install chromium" };
      const r = spawnSync("npx", ["playwright", "install", "chromium"], { cwd: paths.packageRoot, encoding: "utf8", timeout: 900000, shell: process.platform === "win32" });
      return { ok: r.status === 0, detail: r.status === 0 ? "chromium ready" : (r.stderr ?? "").trim().split("\n").slice(0, 3).join(" ") };
    });

  step("launch-test the browser",
    "A green install is not a working browser. This actually launches and screenshots.",
    () => {
      if (!existsSync(join(paths.packageRoot, "node_modules", "playwright"))) return { ok: false, skipped: true, detail: "deferred: Playwright not installed" };
      const pw = join(paths.packageRoot, "node_modules", "playwright");
      // Bare specifier + cwd = package root, matching how design-audit.mjs resolves.
      const code = `const { chromium } = await import("playwright");
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent('<h1>ok</h1>'); const s = await p.screenshot();
console.log(s.length); await b.close();`;
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", timeout: 180000, cwd: paths.packageRoot });
      const all = ((r.stderr ?? "") + (r.stdout ?? "")).trim().split("\n").filter((l) => l && !/^\s*at /.test(l));
      const hint = /Executable doesn't exist/i.test(all.join(" "))
        ? "chromium missing — run: npx playwright install chromium"
        : (all[0] ?? `exit ${r.status}`).slice(0, 160);
      return { ok: r.status === 0, detail: r.status === 0 ? "browser launched and captured" : hint };
    });
}

if (PACKS.length) {
  for (const pack of PACKS) {
    step(`external pack: ${pack}`,
      "EXTERNAL skill, not bundled — no redistributable licence was found for the installed copy. Point this package at your own install rather than redistributing it.",
      () => {
        const at = findPack(pack);
        return { ok: !!at, detail: at ? `using ${displayPath(at)}` : `not found. Install it yourself, or set the override env var, then re-run setup.` };
      });
  }
}

// ---------------------------------------------------------------- run
console.log(`\nSETUP — profile: ${PROFILE}${APPLY ? "  (APPLYING)" : "  (DRY RUN — nothing will change)"}\n`);
console.log(`package : ${displayPath(paths.packageRoot)}`);
console.log(`state   : ${displayPath(stateRoot())}\n`);

const existing = detectExisting();
if (existing.length) {
  console.log("Existing tooling found (setup will not modify it):");
  for (const f of existing) console.log(`  + ${f.what} — ${displayPath(f.where)}`);
  console.log();
}

let failed = 0;
let applied = 0;
for (const s of steps) {
  const label = APPLY ? (s.why) : `(dry run) ${s.why}`;
  let res;
  try { res = s.fn(); } catch (e) { res = { ok: false, detail: e.message }; }
  const icon = res.skipped ? "•" : res.ok ? "✓" : "✗";
  if (!res.skipped) { if (res.ok) applied++; else failed++; }
  console.log(`  ${icon} ${s.name}`);
  console.log(`      ${label}`);
  console.log(`      → ${res.detail}`);
}
console.log(`\n${"-".repeat(60)}`);
if (!APPLY) {
  console.log("Dry run complete. Re-run with --apply to perform these steps.");
} else if (failed) {
  console.log(`${applied} step(s) succeeded, ${failed} FAILED. Fix the failures above, then run:`);
  console.log("  node scripts/doctor.mjs --profile " + PROFILE);
  process.exitCode = 1;
} else {
  console.log("Setup complete. Next:");
  console.log(`  node scripts/install-agent.mjs --agent <pi|codex|claude-code> --scope user`);
  console.log(`  node scripts/doctor.mjs --profile ${PROFILE}`);
}
console.log();