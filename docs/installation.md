# Installation

## Requirements

| Need | Minimum | Notes |
|---|---|---|
| Node.js | 20 | `node -v`. Every script needs it. |
| npm | ships with Node | used for `npm ci` and `npx playwright install` |
| Git | for cloning only | an extracted release archive also works |
| Python | **not required** | only if you install the optional `ui-ux-pro-max` pack |
| Disk | ~200 MB with browser profile | Chromium is ~150 MB |

## Install

```bash
git clone https://github.com/<owner>/designer.git
cd designer
git checkout v1.0.0        # pin a release, not a moving branch

npm ci                     # installs the pinned devDependency tree
node scripts/setup.mjs --profile browser      # dry run
node scripts/setup.mjs --profile browser --apply
```

Setup, in order: verify Node → build the reference index → create the state dir →
run the drift self-test (clean fixture **and** negative control) → install Playwright
→ download Chromium → **launch-test the browser**.

The final step matters: a green install is not a working browser.

## Register with your agent

```bash
node scripts/install-agent.mjs --agent pi --scope user          # dry run
node scripts/install-agent.mjs --agent pi --scope user --apply
node scripts/doctor.mjs --profile browser --agent pi
```

Restart the agent or run `/reload`. See `adapters/<agent>/README.md`.

### Link or copy?

| Mode | Behaviour | Use when |
|---|---|---|
| `--mode link` (default) | symlink/junction → edits to the checkout apply immediately | you're developing the package |
| `--mode copy` | a real copy of the whole package | you will move or delete the checkout |

Copy mode installs the **whole payload** (`SKILL.md`, `references/`, `scripts/`,
`data/`, `benchmarks/`, `lib/`, `licenses/`, `docs/`). Installing only `SKILL.md`
would produce a skill whose scripts and data are missing — the exact failure this
tool exists to prevent.

## Profiles

| Profile | Adds | Use when |
|---|---|---|
| `core` | nothing browser-related | reasoning, grammar, drift checking, reference selection |
| `browser` | Playwright + Chromium | you need the audit and scripted flow tests |
| `full` | core + browser + **opt-in** external packs | you want the extra knowledge packs |

External packs are never installed silently. You must name them:

```bash
node scripts/setup.mjs --profile full --apply --packs ui-ux-pro-max,baoyu-design
```

This package will not redistribute them (no licence found). See `dependencies.md`.

## Platform notes

**Linux** — Playwright's Chromium may need system libraries:

```bash
npx playwright install --with-deps chromium
```

Requires sudo. Setup never runs this for you — run it deliberately.

**macOS** — works on current versions. If `npx` prompts for permission, approve it.

**Windows** — no admin rights needed for the default install path. A symlink may fail
without Developer Mode or admin; `install-agent.mjs` detects this and falls back to a
full copy automatically.

## Offline use

The **core** works fully offline: the reference data is bundled and the static checks
need no network.

Not available offline:
- first-time `npm ci`
- first-time `npx playwright install chromium`
- MCP servers (each is an `npx` download on first run)

To prepare an offline machine, install the browser profile on a networked machine and
copy the resulting Playwright browser cache (`~/.cache/ms-playwright` on Linux/macOS,
`%LOCALAPPDATA%\ms-playwright` on Windows).

## Environment variables

| Variable | Purpose |
|---|---|
| `DESIGNER_STATE` | where personal eval records and receipts live |
| `DESIGNER_ROOT` | override the package root if you relocated it |
| `DESIGNER_UIPM` | path to an `ui-ux-pro-max` install |
| `DESIGNER_BAOYU` | path to a `baoyu-design` install |

## Troubleshooting

**`doctor` says AGENT-READY is `!`** — the agent was not found in a skill directory.
Run the installer, or use the manual bridge in `adapters/generic/README.md`.

**`doctor` says MCP is `!`** — expected. A config entry is not proof of a working
connection. Confirm with your agent's MCP command (`pi mcp list`, `/mcp`).

**`doctor` says BROWSER-READY is `!`** — run
`npx playwright install chromium`, then re-run the doctor.

**Reference selection reports Layer A unavailable** — expected without the optional
pack. See `dependencies.md`.
