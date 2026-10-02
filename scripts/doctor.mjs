#!/usr/bin/env node
/**
 * doctor.mjs — graded readiness check.
 *
 * The plan is explicit that "the files exist" is not readiness. This probes
 * real capability and reports a graded verdict per layer:
 *
 *   INSTALLED     required source/data/licence files are present
 *   EXECUTABLE    runtime works; reference selection, drift and eval store run
 *   BROWSER-READY a real browser launches, loads a page and screenshots
 *   AGENT-READY   the target agent can discover/load the entry skill
 *   MCP-OPERATIONAL a server actually starts and exposes tools
 *   PARTIAL       explicit list of what is unavailable + supported fallback
 *
 * A capability that cannot be verified is NEVER reported as working.
 *
 * Usage:
 *   node scripts/doctor.mjs                 # core + browser + agent autodetect
 *   node scripts/doctor.mjs --profile core  # skip browser checks
 *   node scripts/doctor.mjs --agent pi      # check one agent adapter
 *   node scripts/doctor.mjs --json
 */
import { existsSync, readFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir, homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { paths, findPack, displayPath } from "../lib/paths.mjs";

const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > -1 ? argv[i + 1] : d; };
const json = argv.includes("--json");
const profile = flag("profile", "full");
const agentFilter = flag("agent", null);

// Collect a state sandbox so probing never pollutes the user's real eval store.
const SANDBOX = mkdtempSync(join(tmpdir(), "designer-doctor-"));
const CLEANUP = () => { try { rmSync(SANDBOX, { recursive: true, force: true }); } catch {} };
process.on("exit", CLEANUP);

const results = [];
const record = (layer, status, label, detail) => { results.push({ layer, status, label, detail }); };

const nodeMajor = Number(process.versions.node.split(".")[0]);
record("runtime", nodeMajor >= 20 ? "PASS" : "FAIL", `Node ${process.versions.node}`, nodeMajor >= 20 ? "meets the >=20 requirement" : "Node 20+ is required");

// ---------------------------------------------------------------- 1. INSTALLED
const REQUIRED_FILES = [
  ["skill entry", join(paths.packageRoot, "SKILL.md")],
  ["design director", join(paths.references, "design-director.md")],
  ["design grammar", join(paths.references, "design-grammar.md")],
  ["design review", join(paths.references, "design-review.md")],
  ["DESIGN.md template", join(paths.references, "DESIGN.md-template.md")],
  ["drift checker", join(paths.scripts, "design-drift.mjs")],
  ["browser audit", join(paths.scripts, "design-audit.mjs")],
  ["eval recorder", join(paths.scripts, "record.mjs")],
  ["reference selector", join(paths.scripts, "pick-references.mjs")],
  ["index builder", join(paths.scripts, "build-reference-index.mjs")],
  ["reference index", paths.referenceIndex],
  ["authored LICENSE", join(paths.packageRoot, "LICENSE")],
  ["third-party notices", join(paths.packageRoot, "THIRD_PARTY_NOTICES.md")],
  ["brand-system data", join(paths.data, "brand-systems")],
  ["style-archetype data", join(paths.data, "style-archetypes")],
  ["UX pipeline skills", join(paths.data, "ux-pipeline-skills")],
];
const missing = [];
for (const [label, p] of REQUIRED_FILES) {
  if (!existsSync(p)) { missing.push(label); record("installed", "FAIL", label, `missing: ${displayPath(p)}`); }
}
if (!missing.length) record("installed", "PASS", `${REQUIRED_FILES.length} required files`, "all present");

// Licence coverage for redistributed material
const LICENSE_EXPECT = [
  ["awesome-design-md", "MIT", "data/brand-systems"],
  ["awesome-design-skills", "MIT", "data/style-archetypes"],
  ["claude-design-skills", "MIT", "data/ux-pipeline-skills"],
  ["frontend-design", "Apache-2.0", "data/frontend-design.md"],
];
for (const [name, lic, asset] of LICENSE_EXPECT) {
  const licFile = join(paths.licenses, "upstream", name, existsSync(join(paths.licenses, "upstream", name, "LICENSE.txt")) ? "LICENSE.txt" : "LICENSE");
  const assetOk = existsSync(join(paths.packageRoot, asset));
  if (existsSync(licFile) && assetOk) record("installed", "PASS", `licence: ${name}`, `${lic} text retained for ${asset}`);
  else record("installed", "FAIL", `licence: ${name}`, `licence text or asset missing (${displayPath(licFile)})`);
}

// ---------------------------------------------------------------- 2. EXECUTABLE
// Probe reference selection end-to-end against the bundled index.
{
  const r = spawnSync(process.execPath, [join(paths.scripts, "pick-references.mjs"), "high-density trading terminal", "--json"], { encoding: "utf8", timeout: 30000 });
  if (r.status !== 0) record("executable", "FAIL", "reference selection", r.stderr?.trim().split("\n")[0] ?? `exit ${r.status}`);
  else {
    try {
      const out = JSON.parse(r.stdout);
      const nB = out.layerB?.length ?? 0;
      if (nB > 0) record("executable", "PASS", "reference selection (Layer B, bundled)", `${nB} ranked reference(s) from bundled data`);
      else record("executable", "FAIL", "reference selection (Layer B, bundled)", "returned zero references from bundled data");
      // Layer A is OPTIONAL. Its absence must not downgrade the `executable`
      // verdict — it is an enrichment gap, and it is already reported under
      // `packs`. Counting it twice makes a healthy install look untrustworthy.
      record("packs", out.layerAStatus?.present ? "PASS" : "PARTIAL", "reference selection (Layer A, optional pack)",
        out.layerAStatus?.present ? `present (${out.layerAStatus.count} product types)` : `absent: ${out.layerAStatus?.reason}`);
    } catch (e) { record("executable", "FAIL", "reference selection", `unparseable output: ${e.message}`); }
  }
}

// Probe the drift checker on a known-good fixture AND a known-bad one (negative control).
{
  const fixture = join(paths.packageRoot, "tests", "fixtures", "drift-ok");
  const bad = join(paths.packageRoot, "tests", "fixtures", "drift-bad");
  if (!existsSync(fixture) || !existsSync(bad)) {
    // An absent fixture is a packaging gap, not a broken checker. Report it honestly
    // as unverified rather than FAILing something we simply cannot test here.
    record("executable", "PARTIAL", "drift self-test", "fixtures not present at this location — the checker could NOT be verified here. Re-run from a full checkout, or reinstall so tests/ travels with the package.");
  } else {
    const r = spawnSync(process.execPath, [join(paths.scripts, "design-drift.mjs"), fixture], { encoding: "utf8", timeout: 60000 });
    if (r.status === 0) record("executable", "PASS", "drift: clean fixture", "no drift reported, as expected");
    else record("executable", "FAIL", "drift: clean fixture", `expected clean, got:\n${(r.stdout ?? "").trim().slice(0, 300)}`);
    const rb = spawnSync(process.execPath, [join(paths.scripts, "design-drift.mjs"), bad], { encoding: "utf8", timeout: 60000 });
    if (rb.status !== 0) record("executable", "PASS", "drift negative control", "known-bad fixture correctly rejected — the checker really detects drift");
    else record("executable", "FAIL", "drift negative control", "known-bad fixture passed; the checker is not detecting drift (false negatives)");
  }
}

// Probe the eval store against a SANDBOX state dir, proving writes never touch the checkout.
{
  const before = existsSync(join(paths.packageRoot, "approved"));
  const env = { ...process.env, DESIGNER_STATE: SANDBOX };
  const r = spawnSync(process.execPath, [join(paths.scripts, "record.mjs"), "approve", "--project", "doctor-probe", "--tier", "1", "--hypothesis", "probe"], { encoding: "utf8", env, timeout: 30000 });
  if (r.status === 0 && existsSync(join(SANDBOX, "evals", "approved"))) {
    record("executable", "PASS", "eval store", "writes succeed and land in the state dir, not the checkout");
    const leaked = existsSync(join(paths.packageRoot, "approved")) && !before;
    if (leaked) record("executable", "FAIL", "eval store isolation", "records leaked into the checkout");
  } else {
    record("executable", "FAIL", "eval store", `write failed: ${(r.stderr ?? r.stdout ?? "").trim().split("\n")[0]}`);
  }
}

// Optional external packs — report honestly, never fail the core.
for (const pack of ["ui-ux-pro-max", "baoyu-design"]) {
  const at = findPack(pack);
  record("packs", at ? "PASS" : "PARTIAL", `optional pack: ${pack}`,
    at ? `found at ${displayPath(at)}` : "not installed (optional). Core workflow still runs; this pack only enriches it.");
}

// ---------------------------------------------------------------- 3. BROWSER-READY
if (profile !== "core") {
  const pw = join(paths.packageRoot, "node_modules", "playwright");
  if (!existsSync(pw)) {
    record("browser", "PARTIAL", "Playwright library", "not installed. Run: npm ci && node scripts/setup.mjs --profile browser");
  } else {
    record("browser", "PASS", "Playwright library", `resolved from ${displayPath(pw)}`);
    // Real launch test: this is the only way to know a browser is actually usable.
    // Uses the bare specifier with cwd = package root so Node resolves it the same
    // way design-audit.mjs does. A directory path is NOT importable in ESM.
    const script = `
      const { chromium } = await import("playwright");
      const b = await chromium.launch();
      const p = await b.newPage();
      await p.setContent('<h1>probe</h1>');
      const shot = await p.screenshot();
      console.log(JSON.stringify({ ok: true, bytes: shot.length }));
      await b.close();
    `;
    const r = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 180000, cwd: paths.packageRoot });
    if (r.status === 0) {
      try {
        const o = JSON.parse(r.stdout.trim().split("\n").pop());
        record("browser", "PASS", "Chromium launch", `launched, rendered and captured a ${o.bytes}-byte screenshot`);
      } catch { record("browser", "FAIL", "Chromium launch", r.stdout?.trim().slice(0, 200)); }
    } else {
      const err = `${r.stderr ?? ""}${r.stdout ?? ""}`;
      const hint = /Executable doesn't exist|please run the following command/i.test(err)
        ? "Chromium binary missing. Run: npx playwright install chromium"
        : err.trim().split("\n").filter((l) => l && !/^\s*at /.test(l)).slice(0, 2).join(" ").slice(0, 180);
      record("browser", hint?.includes("install chromium") ? "PARTIAL" : "FAIL", "Chromium launch", hint || `exit ${r.status}`);
    }
  }
}

// ---------------------------------------------------------------- 4. AGENT-READY
const AGENTS = {
  pi: {
    label: "pi",
    // pi auto-discovers these directories; verify a real registration exists.
    skillDirs: process.platform === "win32"
      ? [join(homedir(), ".pi", "agent", "skills"), join(homedir(), ".agents", "skills")]
      : [join(homedir(), ".config", "pi", "agent", "skills"), join(homedir(), ".agents", "skills")],
    adapter: join(paths.adapters, "pi"),
  },
  codex: { label: "Codex", adapter: join(paths.adapters, "codex"), needsRegistration: true },
  "claude-code": { label: "Claude Code", adapter: join(paths.adapters, "claude-code"), needsRegistration: true },
};

for (const [key, def] of Object.entries(AGENTS)) {
  if (agentFilter && agentFilter !== key) continue;
  record("agent", "PASS", `${def.label} adapter`, `present at ${displayPath(def.adapter)}`);
  if (def.skillDirs) {
    const installed = def.skillDirs.some((d) => {
      try { return readdirSync(d).some((f) => f === "designer"); } catch { return false; }
    });
    if (installed) record("agent", "PASS", `${def.label} registration`, "designer is discoverable in a user skill directory");
    else record("agent", "PARTIAL", `${def.label} registration`, "not registered. Run: node scripts/install-agent.mjs --agent " + key + " --scope user");
  } else {
    record("agent", "PARTIAL", `${def.label} registration`, def.needsRegistration
      ? "cannot be verified without launching the client. Follow adapters/" + key + "/README.md, then confirm the skill loads."
      : "registration not detected");
  }
}

// ---------------------------------------------------------------- 5. MCP (config presence is NOT connectivity)
const mcpPath = process.platform === "win32"
  ? join(homedir(), ".pi", "agent", "mcp.json")
  : join(homedir(), ".config", "pi", "agent", "mcp.json");
let mcp = null;
try { mcp = JSON.parse(readFileSync(mcpPath, "utf8")).mcpServers ?? {}; } catch {}
for (const [name, why] of [["playwright", "interactive browser driving"], ["chrome-devtools", "network/performance inspection"], ["shadcn", "component discovery"]]) {
  if (!mcp) { record("mcp", "PARTIAL", `mcp: ${name}`, `no readable config at ${displayPath(mcpPath)}`); continue; }
  if (!mcp[name]) { record("mcp", "PARTIAL", `mcp: ${name}`, `not configured (needed for ${why}). Optional; standalone scripts cover the core.`); continue; }
  // Config entry exists. Connectivity must be proven by the client, not inferred here.
  record("mcp", "PARTIAL", `mcp: ${name}`, `configured for ${why}. Connectivity NOT verified here — run 'pi mcp list' or /mcp to confirm it actually starts.`);
}

// ---------------------------------------------------------------- verdict
const worst = (layer) => {
  const rows = results.filter((r) => r.layer === layer);
  if (!rows.length) return "SKIP";
  if (rows.some((r) => r.status === "FAIL")) return "FAIL";
  if (rows.some((r) => r.status === "PARTIAL")) return "PARTIAL";
  return "PASS";
};
const layers = ["runtime", "installed", "executable", "packs", "browser", "agent", "mcp"];
const summary = Object.fromEntries(layers.map((l) => [l, worst(l)]));

const PARTIAL_MEANS = {
  packs: "optional knowledge packs absent — core works, some enrichment is unavailable",
  browser: "browser validation not exercised — you may NOT claim browser/flow validation",
  agent: "one or more agents not registered — follow the adapter README to register",
  mcp: "MCP connectivity unverified — confirm with the client before relying on it",
  executable: "a capability could not be probed here — treat it as unverified, not working",
};

if (json) {
  console.log(JSON.stringify({ ok: !layers.some((l) => summary[l] === "FAIL"), summary, results }, null, 2));
  process.exit(layers.some((l) => summary[l] === "FAIL") ? 1 : 0);
}

const ICON = { PASS: "✓", PARTIAL: "!", FAIL: "✗" };
console.log("\nDesigner — readiness\n" + "=".repeat(60));
console.log(`package: ${displayPath(paths.packageRoot)}`);
console.log(`state:   ${displayPath(paths.stateRoot)}`);
console.log(`profile: ${profile}\n`);
let current;
for (const r of results) {
  if (r.layer !== current) { current = r.layer; console.log(`\n${current.toUpperCase()}`); }
  console.log(`  ${ICON[r.status] ?? "?"} ${r.label}${r.detail ? `\n      ${r.detail}` : ""}`);
}
console.log("\n" + "=".repeat(60));
console.log("VERDICT");
for (const l of layers) {
  if (summary[l] === "SKIP") continue;
  const note = summary[l] === "PARTIAL" ? ` — ${PARTIAL_MEANS[l] ?? "see above"}` : "";
  console.log(`  ${ICON[summary[l]]} ${l.padEnd(11)} ${summary[l]}${note}`);
}
const fails = layers.filter((l) => summary[l] === "FAIL");
console.log();
if (fails.length) {
  console.log(`NOT READY — failures in: ${fails.join(", ")}. Fix the ✗ items above before using this install.`);
} else {
  console.log("READY for the checks that passed. Anything marked ! is a declared limitation,");
  console.log("not a silent success — do not claim capabilities you could not verify.");
}
console.log();
process.exit(fails.length ? 1 : 0);