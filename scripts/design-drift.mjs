#!/usr/bin/env node
/**
 * design-drift.mjs — static design-system consistency enforcement.
 *
 * This is the source-level half of the spec's §24 "automated consistency checks".
 * The runtime half (overflow, contrast, tap targets, console, focus rings in the
 * live page) is `design-audit.mjs` and the Playwright/Chrome-DevTools MCPs.
 * Do not ask an LLM to do what a regex can do reliably.
 *
 * Design lock, mechanically: a value that is not in the project's approved set
 * is reported as drift, not silently accepted. Every finding names the file, the
 * line, the offending value, and the approved alternatives.
 *
 * Usage:
 *   node design-drift.mjs <projectRoot> [--config path] [--json] [--strict]
 *   node design-drift.mjs <projectRoot> --init          # infer config from the project
 *
 * Exit codes: 0 clean · 1 drift found · 2 config/project error
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, basename, sep } from "node:path";

const argv = process.argv.slice(2);
const root = argv.find((a) => !a.startsWith("-"));
const JSON_OUT = argv.includes("--json");
const STRICT = argv.includes("--strict");
const INIT = argv.includes("--init");
const cfgArg = argv.includes("--config") ? argv[argv.indexOf("--config") + 1] : null;

if (!root || !existsSync(root)) {
  console.error("Usage: node design-drift.mjs <projectRoot> [--init] [--config <file>] [--json] [--strict]");
  process.exit(2);
}
const CFG_PATH = cfgArg ? join(root, cfgArg) : join(root, "design-drift.config.json");

const SOURCE_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".vue", ".svelte", ".astro", ".css", ".scss", ".sass", ".less", ".html"]);
// Files that legitimately *define* the system rather than consume it.
// Deliberately narrow: a component stylesheet that merely lives in a `styles/`
// folder is NOT a definer, or real drift inside it would pass unflagged.
const DEFINES_TOKENS = [
  // a directory whose whole purpose is tokens
  /(^|[\\/])(tokens?|theme|themes|variables|design-system|ds)[\\/]/i,
  /(^|[\\/])(tailwind|design)\.config\./i,
  /(^|[\\/])components\.json$/i,
  /\.variables\.(css|scss|sass|less)$/i,
  // A token file may also be identified by name at any depth: `tokens.css`,
  // `theme.css`, `globals.css`, `index.css` inside a css/ or styles/ folder.
  /(^|[\\/])(tokens?|theme|themes|variables|globals|global)\.(css|scss|sass|less|styl)$/i,
  /(^|[\\/])styles?[\\/]index\.(css|scss|sass|less|styl)$/i,
];
const isTokenDefiner = (rel) => DEFINES_TOKENS.some((re) => re.test(rel));

// ------------------------------------------------------------------ config
const DEFAULTS = {
  approvedRadius: [0, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 9999],
  approvedSpacing: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 96],
  approvedFontSize: [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 30, 32, 36, 40, 44, 48, 56, 64, 72],
  approvedShadows: [],
  maxShadowVariants: 4,
  allowRawColorIn: ["**/*.css", "**/tokens/**", "**/theme/**", "**/styles/**", "**/globals.css"],
  ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "**/coverage/**", "**/*.min.*", "**/storybook-static/**", "**/snapshots/**", "**/__snapshots__/**", "**/designs/**"],
  tokenFiles: [],
};

function loadConfig() {
  if (!existsSync(CFG_PATH)) return { ...DEFAULTS, _inferred: true };
  const cfg = JSON.parse(readFileSync(CFG_PATH, "utf8"));
  return { ...DEFAULTS, ...cfg };
}

/** Infer the approved value sets from whatever token source the project has. */
function inferConfig() {
  const cfg = { ...DEFAULTS, tokenFiles: [] };
  const candidates = [
    "src/app.css", "src/index.css", "src/styles/globals.css", "app/globals.css",
    "styles/globals.css", "src/style.css", "src/styles.css", "src/tailwind.css",
    "src/theme.css", "src/tokens.css", "app/globals.css", "src/assets/styles/index.scss",
  ];
  for (const c of candidates) if (existsSync(join(root, c))) cfg.tokenFiles.push(c);
  for (const c of ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs", "tailwind.config.cjs"]) {
    if (existsSync(join(root, c))) cfg.tokenFiles.push(c);
  }
  if (existsSync(join(root, "components.json"))) cfg.tokenFiles.push("components.json");

  // Also pick up any file that is itself a token/theme source anywhere in the
  // tree — a hand-rolled project will not use the conventional paths above.
  const discovered = files.filter((f) => isTokenDefiner(relative(root, f).split(/[\\/]/).join("/")));
  for (const f of discovered) {
    const rel = relative(root, f).split(/[\\/]/).join("/");
    if (!cfg.tokenFiles.includes(rel)) cfg.tokenFiles.push(rel);
  }

  const css = cfg.tokenFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f)).map((f) => readFileSync(join(root, f), "utf8")).join("\n");
  const tw = cfg.tokenFiles.filter((f) => f.includes("tailwind")).map((f) => readFileSync(join(root, f), "utf8")).join("\n");
  const blob = css + tw;

  const radii = [...blob.matchAll(/--radius[a-z0-9-]*:\s*([\d.]+)(px|rem)/gi)].map((m) => Math.round(parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1)));
  if (radii.length) cfg.approvedRadius = [...new Set([0, ...radii])].sort((a, b) => a - b);

  const spaces = [...blob.matchAll(/--(?:space|spacing)-[a-z0-9-]*:\s*([\d.]+)(px|rem)/gi)].map((m) => Math.round(parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1)));
  if (spaces.length) cfg.approvedSpacing = [...new Set([0, ...spaces])].sort((a, b) => a - b);

  const sizes = [...blob.matchAll(/--[a-z0-9-]*(?:font-size|text)-[a-z0-9-]*:\s*([\d.]+)(px|rem)/gi)].map((m) => Math.round(parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1)));
  if (sizes.length) cfg.approvedFontSize = [...new Set(sizes)].sort((a, b) => a - b);

  const shadows = [...blob.matchAll(/(--[a-z0-9-]*shadow[a-z0-9-]*):\s*([^;]+);/gi)].map((m) => m[1]);
  if (shadows.length) cfg.approvedShadows = [...new Set(shadows)];

  return cfg;
}

// ------------------------------------------------------------------ walk
const findings = [];
const add = (severity, rule, file, line, message, detail = {}) => {
  findings.push({ severity, rule, file, line, message, ...detail });
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build" || entry.name === ".next") continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (SOURCE_EXT.has(extname(entry.name))) out.push(p);
  }
  return out;
}

// must be declared before inferConfig() (--init) uses it
const files = walk(root).filter((f) => !/\.min\./.test(f) && !/(^|[\\/])(dist|build|\.next|coverage|__snapshots__)[\\/]/.test(f));
const cfg = INIT ? inferConfig() : loadConfig();
const tokenRel = new Set(cfg.tokenFiles.map((f) => f.split(/[\\/]/).join(sep)));

// ------------------------------------------------------------------ rules
const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const FUNC_COLOR = /\b(?:rgba?|hsla?|oklch|lab|lch)\(([^)]{3,60})\)/g;
const RADIUS = /border-radius:\s*([^;}"']+)/g;
const FONT_SIZE = /font-size:\s*([^;}"']+)/g;
const SPACING = /(?:^|[;{\s])(padding|padding-top|padding-bottom|padding-left|padding-right|padding-block|padding-inline|margin|margin-top|margin-bottom|margin-left|margin-right|margin-block|margin-inline|gap|row-gap|column-gap)\s*:\s*([^;}"']+)/g;
const SHADOW = /box-shadow:\s*([^;}"']+)/g;
const TAILWIND_ARBITRARY = /(?:^|["'`\s])(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|w|h|min-w|min-h|max-w|space-x|space-y|top|left|right|bottom|inset|size)-(\[[^\]]+\])/g;
const TRANSITION_ALL = /transition(-property)?:\s*all\b/g;
const FOCUS = /:focus-visible|focus-visible:|outline-none|outline:\s*(none|0)\b/;

const toPx = (v) => {
  const s = String(v).trim();
  if (/^9999(px)?$|^full$/.test(s)) return 9999;
  const m = /^(-?[\d.]+)(px|rem|em)?$/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  return n * ((m[2] ?? "px") === "rem" || m[2] === "em" ? 16 : 1);
};
const toIntPx = (v) => { const p = toPx(v); return p === null ? null : Math.round(p); };
/** Every length in a shorthand like `0 var(--space-x) 12px` that is a literal. */
const literalsIn = (v) => String(v).split(/\s+/).map(toPx).filter((n) => n !== null);

/**
 * A visually-hidden utility (`.sr-only`) legitimately uses a -1px margin with a
 * clip — that is a clipping idiom, not a spacing decision. Detect the enclosing
 * block so the check stays honest instead of crying wolf.
 */
function inVisuallyHiddenBlock(src, index) {
  const open = src.lastIndexOf("{", index);
  const close = src.indexOf("}", open);
  if (open < 0 || close < 0) return false;
  const block = src.slice(open, close);
  return /clip(-path)?\s*:/.test(block) && /position\s*:\s*absolute/.test(block);
}

const shadowValues = new Set();
const iconImports = new Map();
const componentNames = new Map();

for (const abs of files) {
  const rel = relative(root, abs).split(/[\\/]/).join("/");
  const src = readFileSync(abs, "utf8");
  const isDefiner = isTokenDefiner(rel) || tokenRel.has(rel);
  const lines = src.split(/\r?\n/);
  const lineOf = (idx) => src.slice(0, idx).split("\n").length;

  // --- hard-coded colours outside the token layer
  if (!isDefiner) {
    for (const m of src.matchAll(HEX)) {
      // CSS custom-property *definitions* and gradient stops in a token file are fine;
      // a hex inside a component is drift unless it is inside a var() definition line.
      const ln = lineOf(m.index);
      const lineText = lines[ln - 1] ?? "";
      if (/--[a-z0-9-]+\s*:/.test(lineText)) continue;
      if (/\/\*\s*(design-token|token|palette)/i.test(lineText)) continue;
      add("high", "raw-color", rel, ln, `hard-coded colour ${m[0]} outside the token layer`, { value: m[0], use: "a semantic token (var(--…) or the project's token class)" });
    }
    for (const m of src.matchAll(FUNC_COLOR)) {
      const ln = lineOf(m.index);
      const lineText = lines[ln - 1] ?? "";
      if (/--[a-z0-9-]+\s*:/.test(lineText)) continue;
      // Tailwind arbitrary colour utilities p-[#fff] are caught by HEX already; skip shadows of that
      add("high", "raw-color", rel, ln, `hard-coded colour function ${m[0].slice(0, 40)} outside the token layer`, { value: m[0].slice(0, 40) });
    }
  }

  // --- radius values
  for (const m of src.matchAll(RADIUS)) {
    const px = toIntPx(m[1].split(/\s+/)[0]);
    if (px === null) continue;
    if (px === 9999) { add("low", "pill-radius", rel, lineOf(m.index), `pill radius (9999px) — must be semantically justified`, {}); continue; }
    if (cfg.approvedRadius.length && !cfg.approvedRadius.includes(px)) {
      add("high", "radius-drift", rel, lineOf(m.index), `radius ${px}px is not in the approved radius family`, { value: `${px}px`, approved: cfg.approvedRadius });
    }
  }

  // --- font sizes (exact: 15.5px must not round its way into an approved 16)
  for (const m of src.matchAll(FONT_SIZE)) {
    const px = toPx(m[1].split(/\s+/)[0]);
    if (px === null) continue;
    const approved = cfg.approvedFontSize.map(Number);
    if (approved.length && !approved.some((a) => Math.abs(a - px) < 0.01)) {
      add("medium", "type-drift", rel, lineOf(m.index), `font-size ${px}px is not a declared type role`, { value: `${px}px`, approved: cfg.approvedFontSize });
    }
  }

  // --- raw CSS spacing literals (padding/margin/gap) off the scale
  for (const m of src.matchAll(SPACING)) {
    if (inVisuallyHiddenBlock(src, m.index)) continue;
    for (const px of literalsIn(m[2])) {
      if (cfg.approvedSpacing.includes(px)) continue;
      add("high", "spacing-drift", rel, lineOf(m.index),
        `${m[1]}: ${px}px is not on the approved spacing scale`,
        { value: `${px}px`, approved: cfg.approvedSpacing });
    }
  }

  // --- shadows
  for (const m of src.matchAll(SHADOW)) {
    const v = m[1].trim();
    if (v === "none") continue;
    shadowValues.add(v);
    if (isDefiner) continue;
    const px = toPx(v);
    if (px !== null && cfg.approvedRadius.length && !cfg.approvedRadius.includes(px)) {
      add("low", "shadow-drift", rel, lineOf(m.index), `box-shadow offset ${px}px is not part of the approved geometry family — a shadow that encodes a new size is a new system decision`, { value: v });
    }
  }

  // --- Tailwind arbitrary spacing / sizing
  for (const m of src.matchAll(TAILWIND_ARBITRARY)) {
    const raw = m[1].replace(/^\[|\]$/g, "");
    const px = toPx(raw);
    const utility = m[0].trim().replace(/^["'`\s]/, "");
    if (px === null) continue;
    const isSpacing = /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-/.test(utility);
    if (isSpacing && !cfg.approvedSpacing.includes(px)) {
      add("high", "spacing-drift", rel, lineOf(m.index), `arbitrary spacing ${utility}-[${raw}] (${px}px) — not on the approved spacing scale`, { value: `${px}px`, approved: cfg.approvedSpacing });
    } else if (!isSpacing && !cfg.approvedFontSize.includes(px) && !cfg.approvedRadius.includes(px)) {
      add("low", "arbitrary-value", rel, lineOf(m.index), `arbitrary value ${utility}-[${raw}] (${px}px) — verify this belongs to the system`, { value: `${px}px` });
    }
  }

  // --- craft rule: transition: all
  for (const m of src.matchAll(TRANSITION_ALL)) {
    add("medium", "transition-all", rel, lineOf(m.index), "`transition: all` animates properties you did not intend — name the properties", {});
  }

  // --- craft rule: outline suppression without a replacement
  const hasFocusVisible = /:focus-visible/.test(src);
  if (FOCUS.test(src) && /outline:\s*(none|0)|outline-none/.test(src) && !hasFocusVisible) {
    add("high", "focus-suppressed", rel, 1, "outline removed with no :focus-visible replacement — keyboard focus is invisible", {});
  }

  // --- mixed icon libraries
  for (const m of src.matchAll(/from\s+["']([^"']*(?:icon|icons|glyph|lucide|heroicons|phosphor|feather|tabler|radix-icons|material-symbols|ionicons)[^"']*)["']/g)) {
    const pkg = m[1].split("/").slice(0, 2).join("/");
    if (!iconImports.has(pkg)) iconImports.set(pkg, new Set());
    iconImports.get(pkg).add(rel);
  }

  // --- duplicate component implementations
  if (/\.(tsx|jsx|vue|svelte)$/.test(abs)) {
    const n = basename(abs).replace(/\.(tsx|jsx|vue|svelte)$/, "");
    if (/^[A-Z]/.test(n)) {
      if (!componentNames.has(n)) componentNames.set(n, []);
      componentNames.get(n).push(rel);
    }
  }
}

// --- project-level rules
if (shadowValues.size > (cfg.maxShadowVariants ?? 4)) {
  add("high", "shadow-sprawl", "(project)", 0,
    `${shadowValues.size} distinct box-shadow values — the surface/elevation strategy should be a small named set, not ${shadowValues.size}`,
    { approved: [...shadowValues].slice(0, 12) });
}

const iconPkgs = [...iconImports.keys()];
if (iconPkgs.length > 1) {
  add("medium", "icon-sprawl", "(project)", 0,
    `${iconPkgs.length} icon libraries in one project — pick one family: ${iconPkgs.join(", ")}`, {});
}

for (const [name, where] of componentNames) {
  if (where.length > 1) {
    add("medium", "duplicate-component", "(project)", 0,
      `component "${name}" exists in ${where.length} places — consolidate instead of adding a third: ${where.slice(0, 4).join(", ")}`, {});
  }
}

// ------------------------------------------------------------------ report
const ORDER = { high: 0, medium: 1, low: 2 };
findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);

if (INIT) {
  writeFileSync(CFG_PATH, JSON.stringify({ ...cfg, _note: "Generated by design-drift.mjs --init. Edit freely: these are your design-lock allowlists." }, null, 2) + "\n");
  console.log(`wrote ${relative(process.cwd(), CFG_PATH)}`);
  console.log(`  token files : ${cfg.tokenFiles.length ? cfg.tokenFiles.join(", ") : "(none found — allowlists are defaults)"}`);
  console.log(`  radius      : ${cfg.approvedRadius.join(", ")}`);
  console.log(`  spacing     : ${cfg.approvedSpacing.length} steps`);
  console.log(`  font sizes  : ${cfg.approvedFontSize.join(", ")}`);
  process.exit(0);
}

if (JSON_OUT) {
  console.log(JSON.stringify({ project: root, scanned: files.length, findings }, null, 2));
  process.exit(findings.length ? 1 : 0);
}

const counts = findings.reduce((a, f) => ((a[f.severity] = (a[f.severity] ?? 0) + 1), a), {});

// ------------------------------------------------------------------ rollup
// Systemic first. A rule with 200 hits is ONE decision made badly, not 200 bugs.
// Reporting them as 200 separate defects is exactly the "local patch" thinking
// this system exists to prevent.
const SYSTEMIC = {
  "raw-color": (fs) => `${fs.size} files carry raw colour values outside the token layer. The semantic palette is not the only source of colour here — a second, invisible palette is. Define the missing semantic roles once (state, status, overlay, chart series, brand) and delete the literals.`,
  "radius-drift": (fs) => `${fs.size} files use radii outside the approved family. Geometry has fragmented into per-component choices. Collapse to the declared radius family and map component roles onto it.`,
  "spacing-drift": (fs) => `${fs.size} files use spacing off the scale. The spacing rhythm is being re-decided at every call site. Re-express these on the scale; add a step only if several sites need the same new relationship.`,
  "type-drift": (fs) => `${fs.size} files set font sizes that are not declared type roles. Typography has escaped its hierarchy. Map each to a role, or declare the role once if it is genuinely missing.`,
  "shadow-drift": (fs) => `${fs.size} files introduce box-shadows whose geometry is not in the system. Elevation is being invented per component. Pick one surface strategy and express it as a small named set.`,
  "shadow-sprawl": () => "The surface/elevation strategy is a set of one-off shadows rather than a small named family. Hierarchy is coming from shadow noise instead of from borders, tone or spacing. Choose one and normalise.",
  "icon-sprawl": () => "More than one icon family is installed. Icons are among the most visible carriers of visual identity; mixing families is the fastest way to look assembled rather than designed.",
  "duplicate-component": () => "The same component name exists in several places. Component reuse has failed here — consolidate before adding anything else.",
  "focus-suppressed": (fs) => `${fs.size} files remove an outline with no :focus-visible replacement. Keyboard focus is invisible in this product. Fix once in the base layer, not per component.`,
  "transition-all": (fs) => `${fs.size} files use transition: all. Motion is undirected; it animates properties nobody chose.`,
  "pill-radius": (fs) => `${fs.size} files use pill geometry. A pill must be a semantic decision, not a default.`,
  "arbitrary-value": (fs) => `${fs.size} files use arbitrary values outside spacing/type/geometry. Verify each belongs to the system.`,
};
const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, { rule: f.rule, severity: f.severity, count: 0, files: new Set(), values: new Set() });
  const r = byRule.get(f.rule);
  r.count++;
  r.files.add(f.file);
  if (f.value) r.values.add(f.value);
}
const rollup = [...byRule.values()]
  .map((r) => ({ rule: r.rule, severity: r.severity, count: r.count, files: r.files.size, values: [...r.values].slice(0, 10), systemic: (SYSTEMIC[r.rule] ?? ((f) => `${f} findings.`))(r.files) }))
  .sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || b.count - a.count);

if (JSON_OUT) {
  console.log(JSON.stringify({ project: root, scanned: files.length, config: cfg._inferred ? null : CFG_PATH, rollup, findings }, null, 2));
  process.exit(findings.length ? 1 : 0);
}

console.log(`design-drift — ${relative(process.cwd(), root) || root}`);
console.log(`scanned ${files.length} source files · ${cfg._inferred ? "NO CONFIG (allowlists are defaults — run with --init to lock them to this project)" : `config ${basename(CFG_PATH)}`}`);
if (!findings.length) {
  console.log("\n✅ no drift. Every colour, radius, spacing step, type size and shadow in source is on the approved list.");
  process.exit(0);
}
console.log(`\n${counts.high ?? 0} high · ${counts.medium ?? 0} medium · ${counts.low ?? 0} low`);
console.log(`\n══ SYSTEMIC ROLLUP ══ read this before opening any file ══`);
for (const r of rollup) {
  const icon = r.severity === "high" ? "✗" : r.severity === "medium" ? "!" : "·";
  console.log(`\n${icon} ${r.rule} — ${r.count} findings across ${r.files} file(s)`);
  console.log(`  ${r.systemic}`);
  if (r.values.length) console.log(`  offending values: ${r.values.join(", ")}${r.values.length >= 10 ? " …" : ""}`);
}
console.log(`\n══ FINDINGS ══ (--json for machine-readable) ══\n`);
let lastFile = null;
for (const f of findings) {
  if (f.file !== lastFile) { console.log(`\n${f.file}`); lastFile = f.file; }
  const icon = f.severity === "high" ? "✗" : f.severity === "medium" ? "!" : "·";
  console.log(`  ${icon} ${f.line ? `:${f.line}` : ""} [${f.rule}] ${f.message}`);
  if (f.approved?.length) console.log(`      approved: ${f.approved.slice(0, 14).join(", ")}${f.approved.length > 14 ? " …" : ""}`);
  if (f.use) console.log(`      instead : ${f.use}`);
}
console.log(`\nFix at the system layer, not per call site. If a value genuinely belongs, add it to`);
console.log(`${relative(process.cwd(), CFG_PATH)} — never inline it.`);

process.exit(STRICT && (counts.high ?? 0) > 0 ? 1 : findings.length ? 1 : 0);
