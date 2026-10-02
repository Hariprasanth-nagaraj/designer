/** Registry shared by installer, uninstaller and doctor. Presence is not client discovery. */
import {readFileSync, existsSync} from "node:fs";
import {join, resolve} from "node:path";
import {homedir} from "node:os";
import {paths} from "./paths.mjs";
export const agents = JSON.parse(readFileSync(join(paths.data, "agents.json"), "utf8")).agents;
export function agentFor(id) {
  const aliases = {"claude-code":"claude", generic:"universal"};
  return agents.find(a => a.id === (aliases[id] ?? id) || a.label.toLowerCase() === String(id).toLowerCase());
}
export const expand = p => p.startsWith("~/") ? join(homedir(), p.slice(2)) : resolve(p);
export const detected = a => (a.detect ?? []).some(p => existsSync(expand(p)));
export function directoryFor(a, scope = "user", cwd = process.cwd()) {
  const p = scope === "project" ? a.projectDirs?.[0] : a.dirs?.[0];
  return p ? (scope === "project" ? resolve(cwd, p) : expand(p)) : null;
}
export function invocation(a) {
  return a.id === "pi" ? "/skill:designer <brief>" : a.id === "claude" ? "/designer <brief>" :
    "Read <installed-directory>/SKILL.md and follow it for this task.";
}
