# Profiles and paths

## Profiles

- core: Node 20+, bundled reference/UX intelligence, static drift and preference store.
- browser: core plus pinned Playwright/Chromium in user-owned state.
- full: browser plus ui-ux-pro-max and baoyu-design from pinned upstream repositories,
  or matching user-selected existing packs.

Setup previews without changing files, state, downloads or registrations. --apply is
required for execution. Full optional repositories require git/network; advanced
ui-ux-pro-max search requires Python 3. Setup never edits MCP/agent configuration.

## Overrides

| Variable | Meaning |
|---|---|
| DESIGNER_ROOT | Absolute valid package root containing SKILL.md; default is module-relative. |
| DESIGNER_STATE | Personal state root; keep outside packages/checkouts. |
| DESIGNER_UIPM | Existing full ui-ux-pro-max root containing data/scripts. |
| DESIGNER_BAOYU | Existing baoyu-design skill root. |
| DESIGNER_PLAYWRIGHT | Matching playwright module directory, not a browser executable. |
| PLAYWRIGHT_BROWSERS_PATH | Optional explicit Chromium cache choice. |
| PW_EXECUTABLE_PATH | Optional browser executable for audit; requires the Node library too. |

A missing explicit optional pack/module override is reported rather than silently
substituted. Default state: LOCALAPPDATA/designer on Windows; Library/Application
Support/designer on macOS; XDG_STATE_HOME/designer or ~/.local/state/designer on Linux.

Managed runtime has a version-specific directory and npm lockfile. Agent copies and
global installs share it. Setup reuses matching package-local development dependencies
without requiring them for distributed users.

If npm/git/download/launch fails, setup exits nonzero. Linux system dependencies,
proxies, offline caches and OS security policies are managed by the user.
No green install message is a substitute for successful Chromium launch.

For abrupt interruption, inspect .designer-stage-* backup folders beside agent
destinations. Browser runtime .lock directories prevent parallel bootstrap; remove
a stale lock only after confirming no installer is running.
