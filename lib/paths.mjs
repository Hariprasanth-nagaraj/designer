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
import { join, dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

/** <repo>/lib/paths.mjs -> <repo> */
export const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const env = process.env;

/** Optional explicit override. Must be absolute to be trusted. */
function explicitRoot() {
  const raw = env.DESIGNER_ROOT;
  if (!raw) return null;
  const p = resolve(raw);
  return isAbsolute(p) ? p : null;
}

/**
 * Where the user keeps personal, non-versioned state.
 *   DESIGNER_STATE  (explicit)
 *   XDG_STATE_HOME           (linux convention)
 *   ~/Library/Application Support/designer  (macOS convention)
 *   %LOCALAPPDATA%\designer                 (Windows convention)
 */
export function stateRoot() {
  if (env.DESIGNER_STATE) return resolve(env.DESIGNER_STATE);
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
      resolve(env.DESIGNER_UIPM ?? join(paths.data, "packs", "ui-ux-pro-max")),
    "baoyu-design": () =>
      resolve(env.DESIGNER_BAOYU ?? join(paths.data, "packs", "baoyu-design")),
  };
  const custom = direct[name]?.();
  if (custom && existsSync(custom)) return custom;

  // Agent skill locations, platform-aware. Checked only as a courtesy to users
  // who already have these installed; never required.
  const home = homedir();
  const roots =
    process.platform === "win32"
      ? [join(home, ".agents", "skills"), join(home, ".pi", "agent", "skills"), join(home, ".claude", "skills")]
      : [join(home, ".agents", "skills"), join(home, ".config", "pi", "agent", "skills"), join(home, ".claude", "skills")];

  for (const root of roots) {
    const candidate = join(root, name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Formats a path for display in output, keeping it obviously host-relative. */
export function displayPath(p) {
  return p.replace(/\\/g, "/").replace(/^\/([A-Za-z]:)/, "$1");
}