# Security

## What this package runs on your machine

This package ships Node scripts and Markdown instructions. Read them before running —
that is the same advice pi gives for any third-party package.

| Script | What it does | Writes to |
|---|---|---|
| `setup.mjs` | checks runtime, builds an index, creates the state dir, optionally `npm ci` + `npx playwright install` | package checkout (`data/reference-index.json`), state dir, browser cache |
| `doctor.mjs` | runs probes in a temp sandbox | temp only (cleaned on exit) |
| `install-agent.mjs` | registers the skill with an agent | your agent's user skill directory; `state/receipts/` |
| `uninstall-agent.mjs` | removes a registration it created | removes only what it installed and only if unchanged |
| `design-drift.mjs` | static source analysis | **nothing** — read-only over your project |
| `design-audit.mjs` | launches a browser against a URL **you** supply | `audit/` output dir you name |
| `pick-references.mjs` / `build-reference-index.mjs` | retrieval / indexing | `data/reference-index.json` |
| `record.mjs` | writes personal eval records | state dir (outside the checkout) |

## Principles this package tries to hold

1. **Dry run by default.** Setup and install print their plan and change nothing
   without `--apply`.
2. **No silent clobbering.** `install-agent.mjs` refuses to overwrite a directory it
   did not create, and exits non-zero instead.
3. **No privileged installs.** The package never runs `sudo`, never installs system
   packages, and never installs a global npm package.
4. **No network calls you did not ask for.** The only network use is `npm ci`,
   `npx playwright install`, and MCP servers you add yourself.
5. **Read-only over your project.** `design-drift.mjs` never writes to the project it
   analyses. `--init` writes `design-drift.config.json` into the project — that is the
   one intentional write, and it is explicit.
6. **Your data stays out of Git.** Eval records live outside the checkout and are
   git-ignored even if misconfigured.

## Third-party executable content

The bundled material under `data/` is **reference Markdown** — design documents from
MIT/Apache-2.0 projects. It is read as text by a human or an agent; it is never
executed. `data/ux-pipeline-skills/` contains agent-skill text from a third party and
should be read before relying on it, in the same way you would read any third-party
prompt you install.

## MCP servers

MCP servers are **not bundled**. They are third-party processes with network access,
installed by you under your own account. Add them only if you want them, and review
what each grants.

## Reporting a vulnerability

Open a private security advisory on the repository rather than a public issue.
Do not include exploit payloads against other people's projects.
