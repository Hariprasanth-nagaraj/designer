/**
 * paths.mjs — single source of truth for where everything lives.
 *
 * Design rules this module enforces:
 *   - Package content is always resolved from this file's own location.
 *   - Nothing is ever resolved relative to the current working directory.
 *   - The developer's home directory is never assumed to contain this system.
 *   - User state (eval history, install receipts) lives OUTSIDE the checkout,
 *     so updating or deleting the repo never destroys a user's design memory.
 */
import { homedir } from "node:os";
import { join, dirname, resolve, isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

/** <repo>/lib/paths.mjs -> <repo> */
const detectedRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const env = process.env;

/** Optional explicit override. Must be absolute to be trusted. */
function explicitRoot() {
  const raw = env.DESIGNER_ROOT;
  if (!raw) return null;
  if (!isAbsolute(raw)) throw new Error("DESIGNER_ROOT must be an absolute path");
  const p = resolve(raw);
  if (!existsSync(join(p, "SKILL.md"))) throw new Error("DESIGNER_ROOT must contain SKILL.md");
  return p;
}

export const PACKAGE_ROOT = explicitRoot() ?? detectedRoot;

/**
 * Where the user keeps personal, non-versioned state.
 *   DESIGNER_STATE  (explicit)
 *   XDG_STATE_HOME           (linux convention)
 *   ~/Library/Application Support/designer  (macOS convention)
 *   %LOCALAPPDATA%\designer                 (Windows convention)
 */
export function stateRoot() {
  if (env.DESIGNER_STATE) {
    const state = resolve(env.DESIGNER_STATE), rel = relative(PACKAGE_ROOT, state);
    if (!rel || (!rel.startsWith("..") && !isAbsolute(rel))) throw new Error("DESIGNER_STATE must remain outside the package root");
    return state;
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "designer");
  }
  if (process.platform === "win32" && env.LOCALAPPDATA) {
    return join(env.LOCALAPPDATA, "designer");
  }
  if (env.XDG_STATE_HOME) return join(env.XDG_STATE_HOME, "designer");
  return join(homedir(), ".local", "state", "designer");
}

export const paths = {
  /** Immutable, shipped with the repo. */
  packageRoot: PACKAGE_ROOT,
  references: join(PACKAGE_ROOT, "references"),
  scripts: join(PACKAGE_ROOT, "scripts"),
  data: join(PACKAGE_ROOT, "data"),
  benchmarks: join(PACKAGE_ROOT, "benchmarks"),
  adapters: join(PACKAGE_ROOT, "adapters"),
  licenses: join(PACKAGE_ROOT, "licenses"),
  referenceIndex: join(PACKAGE_ROOT, "data", "reference-index.json"),

  /** Mutable, user-owned. Created on demand; never inside the checkout. */
  stateRoot: stateRoot(),
  evals: join(stateRoot(), "evals"),
  receipts: join(stateRoot(), "receipts"),
};

/**
 * Optional external knowledge packs are NOT bundled (no redistributable license
 * was found for them). If a user installs one, we look for it in this order:
 *   1. an explicit env override
 *   2. a checkout-local `packs/<name>/` directory
 *   3. well-known agent skill locations
 * Returns null when absent — callers must degrade honestly, never fake a result.
 */
export function findPack(name) {
  const direct = {
    "ui-ux-pro-max": () =>
      resolve(env.DESIGNER_UIPM || join(paths.data, "packs", "ui-ux-pro-max")),
    "baoyu-design": () =>
      resolve(env.DESIGNER_BAOYU || join(paths.data, "packs", "baoyu-design")),
  };
  const override = name === "ui-ux-pro-max" ? env.DESIGNER_UIPM : name === "baoyu-design" ? env.DESIGNER_BAOYU : null;
  const valid = p => {
    if (name === "ui-ux-pro-max") return existsSync(join(p, "data/products.csv")) && existsSync(join(p, "scripts/search.py"));
    if (name !== "baoyu-design") return false;
    try { return /\nname:\s*["\']?baoyu-design["\']?\s*\r?\n/.test(readFileSync(join(p, "SKILL.md"), "utf8")); } catch { return false; }
  };
  if (override) return valid(resolve(override)) ? resolve(override) : null;
  const custom = direct[name]?.();
  if (custom && valid(custom)) return custom;

  // Pinned optional repositories installed by setup live in personal state.
  const managed = name === "ui-ux-pro-max"
    ? join(paths.stateRoot, "packs", name, "src", "ui-ux-pro-max")
    : name === "baoyu-design" ? join(paths.stateRoot, "packs", name, "skills", name) : null;
  if (managed && valid(managed)) return managed;

  // Agent skill locations, platform-aware. Checked only as a courtesy to users
  // who already have these installed; never required.
  const home = homedir();
  const roots =
    process.platform === "win32"
      ? [join(home, ".agents", "skills"), join(home, ".pi", "agent", "skills"), join(home, ".claude", "skills")]
      : [join(home, ".agents", "skills"), join(home, ".pi", "agent", "skills"), join(home, ".claude", "skills")];

  for (const root of roots) {
    const candidate = join(root, name);
    if (valid(candidate)) return candidate;
  }
  return null;
}

/** Formats a path for display in output, keeping it obviously host-relative. */
export function displayPath(p) {
  return p.replace(/\\/g, "/").replace(/^\/([A-Za-z]:)/, "$1");
}