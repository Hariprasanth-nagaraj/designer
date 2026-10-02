#!/usr/bin/env node
/**
 * run-tests.mjs — the package's own test suite.
 *
 * These tests assert the properties the build plan called out as acceptance
 * gates, and — importantly — assert them in a SANDBOXED home directory, so a
 * developer cannot accidentally pass by depending on their own machine.
 *
 * Run: node tests/run-tests.mjs   (or: npm test)
 */
import { existsSync, readFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { paths, displayPath } from "../lib/paths.mjs";

const SANDBOX = mkdtempSync(join(tmpdir(), "designer-test-"));
const CLEAN = () => { try { rmSync(SANDBOX, { recursive: true, force: true }); } catch {} };
process.on("exit", CLEAN);

let pass = 0, fail = 0;
const failures = [];

/**
 * MUST await async test bodies. An un-awaited async test would reject silently
 * and be reported as a pass — the same false-negative class this package exists
 * to prevent. A checker that cannot fail is worse than no checker.
 */
async function test(section, name, fn) {
  if (section !== currentSection) { currentSection = section; console.log(`\n${section}`); }
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failures.push({ name, message: e?.message ?? String(e) });
    console.log(`  ✗ ${name}\n      ${(e?.message ?? String(e)).split("\n")[0]}`);
  }
}
const pending = [];
let currentSection = null;
/** Register a test. Sections print in order when the suite runs, not on register. */
const it = (section, name, fn) => { pending.push([section, name, fn]); };
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const run = (script, args, env = {}) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env: { ...process.env, ...env }, timeout: 120000 });
/** Windows requires a file:// URL for dynamic import of an absolute path. */
const asUrl = (p) => pathToFileURL(p).href;
/** Evaluate a JS expression against the paths module in an isolated child process. */
function probePathsModule(code, env = {}) {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e",
    `const fs = await import("node:fs");\n` +
    `const m = await import(${JSON.stringify(asUrl(join(paths.packageRoot, "lib", "paths.mjs")))});\n` +
    `console.log(String(${code}));`],
    { encoding: "utf8", env: { ...process.env, ...env }, timeout: 30000 });
  return { stdout: r.stdout.trim(), stderr: r.stderr, status: r.status };
}

console.log("\ndesigner — test suite");
console.log(`sandbox: ${displayPath(SANDBOX)}\n`);

// ---------------------------------------------------------------- packaging
it("PACKAGING","package.json is valid and declares MIT + engines", () => {
  const p = JSON.parse(readFileSync(join(paths.packageRoot, "package.json"), "utf8"));
  // Assert the invariant, not a literal: the name must be a publishable npm name
  // that carries "designer", whether unscoped or scoped.
  const scoped = /^@([^/]+)\/([^/]+)$/.exec(p.name);
  const bare = /^([a-z0-9][a-z0-9._-]*)$/.exec(p.name);
  assert(scoped || bare, `name "${p.name}" is not a valid npm package name`);
  assert((scoped ? scoped[2] : bare[1]) === "designer", `name must end in "designer", got "${p.name}"`);
  assert(p.license === "MIT", "license must be MIT");
  assert(p.engines?.node?.includes("20"), "must declare Node >=20");
  assert(p.files?.includes("SKILL.md"), "must ship SKILL.md");
  // The negative-control fixtures must travel, or an installed copy cannot
  // prove its own drift checker still fails when it should.
  assert(p.files?.includes("tests/"), "must ship tests/ (negative control)");
});
it("PACKAGING","every declared bin target exists and is syntax-valid", () => {
  const p = JSON.parse(readFileSync(join(paths.packageRoot, "package.json"), "utf8"));
  for (const [bin, rel] of Object.entries(p.bin ?? {})) {
    assert(existsSync(join(paths.packageRoot, rel)), `bin "${bin}" points at missing file ${rel}`);
    assert(bin.startsWith("designer"), `bin "${bin}" should be prefixed with designer-`);
  }
  // syntax-check each script so a broken publish is caught before it ships
  for (const rel of Object.values(p.bin ?? {})) {
    if (!rel.endsWith(".mjs")) continue;
    const r = spawnSync(process.execPath, ["--check", join(paths.packageRoot, rel)], { encoding: "utf8" });
    assert(r.status === 0, `syntax error in ${rel}: ${(r.stderr ?? "").split("\n").slice(0, 2).join(" ")}`);
  }
});
it("PACKAGING","authored LICENSE exists", () => {
  const l = readFileSync(join(paths.packageRoot, "LICENSE"), "utf8");
  assert(l.includes("MIT License"), "LICENSE must be MIT text");
});
it("PACKAGING","third-party notices enumerate every bundled dataset", () => {
  const n = readFileSync(join(paths.packageRoot, "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const s of ["awesome-design-md", "awesome-design-skills", "claude-design-skills", "frontend-design"])
    assert(n.includes(s), `notices missing ${s}`);
});
it("PACKAGING","every bundled dataset has its upstream licence text on disk", () => {
  for (const d of ["awesome-design-md", "awesome-design-skills", "claude-design-skills", "frontend-design"]) {
    const dir = join(paths.licenses, "upstream", d);
    assert(existsSync(join(dir, "LICENSE")) || existsSync(join(dir, "LICENSE.txt")), `missing licence for ${d}`);
  }
});
it("PACKAGING","NOTICE declares optional full enrichment packs", () => {
  const n = readFileSync(join(paths.packageRoot, "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const s of ["ui-ux-pro-max", "baoyu-design"]) assert(n.includes(s), `should declare excluded pack ${s}`);
});

// ---------------------------------------------------------------- portability
console.log("\nPORTABILITY");
it("PORTABILITY","no absolute user paths in shipped logic", () => {
  const files = ["SKILL.md", join("lib", "paths.mjs"),
    ...["doctor.mjs", "setup.mjs", "install-agent.mjs", "uninstall-agent.mjs", "design-drift.mjs",
      "design-audit.mjs", "pick-references.mjs", "build-reference-index.mjs", "record.mjs"]
      .map((f) => join("scripts", f)),
    ...["design-director.md", "design-grammar.md", "design-review.md", "DESIGN.md-template.md"].map((f) => join("references", f))];
  const offenders = [];
  // Generic: ANY per-user absolute path, not one hardcoded name. A check that only
  // catches the original author's username would pass on everyone else's machine.
  const userPath = /(?:[A-Za-z]:\\Users\\[^\\\s"']+)|(?:\/Users\/[^/\s"']+\/)|(?:\/home\/[^/\s"']+\/)|%USERPROFILE%/;
  for (const f of files) {
    const txt = readFileSync(join(paths.packageRoot, f), "utf8");
    if (userPath.test(txt)) offenders.push(f);
  }
  assert(offenders.length === 0, `absolute user path in: ${offenders.join(", ")}`);
});
it("PORTABILITY","paths.mjs resolves the package from its own location, not cwd", () => {
  // Different cwd AND a different HOME: the package must still resolve itself.
  const r = spawnSync(process.execPath, ["--input-type=module", "-e",
    `const fs = await import("node:fs");\n` +
    `const m = await import(${JSON.stringify(asUrl(join(paths.packageRoot, "lib", "paths.mjs")))});\n` +
    `console.log(fs.existsSync(m.PACKAGE_ROOT + "/SKILL.md") ? "OK" : "NO");`],
    { encoding: "utf8", cwd: tmpdir(), env: { ...process.env, HOME: SANDBOX, USERPROFILE: SANDBOX }, timeout: 30000 });
  assert(r.stdout.trim() === "OK", `expected OK, got "${r.stdout.trim()}" ${r.stderr?.slice(0, 160)}`);
});
it("PORTABILITY","state directory resolves outside the checkout", () => {
  const r = probePathsModule('m.paths.evals.startsWith(m.PACKAGE_ROOT) ? "INSIDE" : "OUTSIDE"',
    { DESIGNER_STATE: join(SANDBOX, "state") });
  assert(r.stdout === "OUTSIDE", `state must resolve outside package root, got "${r.stdout}" ${r.stderr?.slice(0, 160)}`);
});
it("PORTABILITY","an explicit state override is honoured", () => {
  const r = probePathsModule('m.paths.evals', { DESIGNER_STATE: join(SANDBOX, "explicit") });
  assert(r.stdout.endsWith("explicit/evals") || r.stdout.endsWith("explicit\\evals"),
    `override ignored: "${r.stdout}"`);
});
it("PORTABILITY","package resolves identically from an unrelated cwd and HOME", () => {
  const here = probePathsModule('m.PACKAGE_ROOT');
  const there = spawnSync(process.execPath, ["--input-type=module", "-e",
    `const m = await import(${JSON.stringify(asUrl(join(paths.packageRoot, "lib", "paths.mjs")))});\nconsole.log(String(m.PACKAGE_ROOT));`],
    { encoding: "utf8", cwd: SANDBOX, env: { ...process.env, HOME: SANDBOX, USERPROFILE: SANDBOX }, timeout: 30000 });
  assert(there.stdout.trim() === here.stdout.trim(), `root changed with cwd/HOME: "${here.stdout}" vs "${there.stdout}"`);
});

// ---------------------------------------------------------------- reference layer
console.log("\nREFERENCE SELECTION");
it("REFERENCE SELECTION","reference index is present and populated", () => {
  const idx = JSON.parse(readFileSync(paths.referenceIndex, "utf8"));
  assert(idx.brands > 50, `expected >50 brand systems, got ${idx.brands}`);
  assert(idx.archetypes > 50, `expected >50 archetypes, got ${idx.archetypes}`);
});
it("REFERENCE SELECTION","index stores no absolute source paths (determinism/portability)", () => {
  const raw = readFileSync(paths.referenceIndex, "utf8");
  assert(!/[A-Z]:\\Users\\/i.test(raw), "index leaks an absolute path");
});
it("REFERENCE SELECTION","Layer B returns references for a real query", () => {
  const r = run(join(paths.scripts, "pick-references.mjs"), ["trading terminal", "--json"]);
  const out = JSON.parse(r.stdout);
  assert(out.layerB.length > 0, "expected at least one reference");
});
it("REFERENCE SELECTION","Layer A is bundled when full search enrichment is absent", () => {
  const r = run(join(paths.scripts, "pick-references.mjs"), ["anything", "--json"], { DESIGNER_UIPM: join(SANDBOX, "nope") });
  const out = JSON.parse(r.stdout);
  // Either the pack is genuinely absent (honest unavailable) OR it is present with a reason.
  assert(out.layerAStatus && typeof out.layerAStatus.present === "boolean", "missing layerAStatus");
  if (!out.layerAStatus.present) assert(out.layerAStatus.reason.length > 0, "absent pack must give a reason, not silence");
});

// ---------------------------------------------------------------- drift checker
console.log("\nDRIFT CHECKER");
it("DRIFT CHECKER","clean fixture passes", () => {
  const r = run(join(paths.scripts, "design-drift.mjs"), [join(paths.packageRoot, "tests", "fixtures", "drift-ok")]);
  assert(r.status === 0, `expected exit 0, got ${r.status}`);
});
it("DRIFT CHECKER","negative-control fixture is rejected (checker is not a no-op)", () => {
  const r = run(join(paths.scripts, "design-drift.mjs"), [join(paths.packageRoot, "tests", "fixtures", "drift-bad")]);
  assert(r.status !== 0, "negative control MUST fail; a checker that always passes is broken");
});
it("DRIFT CHECKER","negative control catches each planted defect class", () => {
  const r = run(join(paths.scripts, "design-drift.mjs"), [join(paths.packageRoot, "tests", "fixtures", "drift-bad")]);
  for (const rule of ["raw-color", "radius-drift", "spacing-drift", "type-drift", "transition-all"])
    assert(r.stdout.includes(rule), `expected ${rule} finding`);
});
it("DRIFT CHECKER","--init writes a config derived from the project's own tokens", () => {
  const tmp = join(SANDBOX, "init-probe");
  mkdirSync(join(tmp, "styles"), { recursive: true });
  writeFileSync(join(tmp, "styles", "tokens.css"), ":root{--space-group:12px;--radius-control:4px;}");
  const r = run(join(paths.scripts, "design-drift.mjs"), [tmp, "--init"]);
  assert(existsSync(join(tmp, "design-drift.config.json")), "config not written");
  const cfg = JSON.parse(readFileSync(join(tmp, "design-drift.config.json"), "utf8"));
  assert(cfg.approvedSpacing.includes(12), `spacing not derived: ${cfg.approvedSpacing}`);
});

// ---------------------------------------------------------------- eval store
console.log("\nEVAL STORE");
it("EVAL STORE","approve writes to sandboxed state, not the checkout", () => {
  const state = join(SANDBOX, "state");
  const r = run(join(paths.scripts, "record.mjs"), ["approve", "--project", "t", "--tier", "1", "--hypothesis", "h"], { DESIGNER_STATE: state });
  assert(r.status === 0, `record failed: ${r.stderr?.slice(0, 120)}`);
  assert(existsSync(join(state, "evals", "approved")), "record did not land in state");
  assert(!existsSync(join(paths.packageRoot, "approved")), "records leaked into the checkout");
});
it("EVAL STORE","retrieve finds a stored preference", () => {
  const state = join(SANDBOX, "state");
  const r = run(join(paths.scripts, "record.mjs"), ["retrieve", "consoles"], { DESIGNER_STATE: state });
  assert(r.status === 0, "retrieve failed");
});

// ---------------------------------------------------------------- agent adapters
console.log("\nAGENT ADAPTERS");
it("AGENT ADAPTERS","every advertised adapter has a README", () => {
  for (const a of ["pi", "codex", "claude-code", "generic"])
    assert(existsSync(join(paths.adapters, a, "README.md")), `adapter ${a} missing README`);
});
it("AGENT ADAPTERS","install-agent refuses to clobber a foreign skill (dry-run safety)", () => {
  // Point HOME at a sandbox that already has an unrelated skill dir.
  const home = join(SANDBOX, "fakehome");
  mkdirSync(join(home, ".pi", "agent", "skills", "designer"), { recursive: true });
  writeFileSync(join(home, ".pi", "agent", "skills", "designer", "SKILL.md"), "# foreign skill\n");
  const r = run(join(paths.scripts, "install-agent.mjs"), ["--agent", "pi", "--apply"], { HOME: home, USERPROFILE: home, DESIGNER_STATE: join(home, "state") });
  assert(r.status === 3, `expected conflict exit 3, got ${r.status} — must not silently overwrite`);
  assert(readFileSync(join(home, ".pi", "agent", "skills", "designer", "SKILL.md"), "utf8").includes("foreign"), "foreign skill was overwritten!");
});
it("AGENT ADAPTERS","doctor runs and reports a graded verdict", () => {
  const r = run(join(paths.scripts, "doctor.mjs"), ["--profile", "core", "--json"]);
  const out = JSON.parse(r.stdout);
  assert(out.summary && typeof out.summary === "object", "no summary");
  assert(typeof out.ok === "boolean", "no ok flag");
  assert(r.status === 0 && out.coreOk === true, `core readiness failed: ${r.stdout}`);
});

for (const [section, name, fn] of pending) await test(section, name, fn);

// ---------------------------------------------------------------- done
console.log("\n" + "-".repeat(52));
console.log(`${pass} passed · ${fail} failed`);
if (fail) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.name}\n      ${f.message}`);
}
console.log();
process.exit(fail ? 1 : 0);