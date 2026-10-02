# Install

Two minutes. Pick the row that matches you.

| I want to… | Do this | Needs an AI agent? |
|---|---|---|
| **Check my CSS for design drift** | `npm i -g @hari-prasanth-nagaraj/designer` | **No** |
| **Find design references for a brief** | same install | **No** |
| **Record design decisions** | same install | **No** |
| **Audit a running page in a browser** | same install + `npx playwright install chromium` | **No** |
| **Get an agent to design a screen for me** | same install + tell your agent one line | Yes |

**The core needs nothing but Node 20+.** No npm install step, no build, no account.

---

## Install

```bash
npm install -g @hari-prasanth-nagaraj/designer
```

That gives you these commands, usable from any directory:

| Command | What it does |
|---|---|
| `designer-doctor` | Check what's working. Start here. |
| `designer-design-drift <project>` | Find design drift in your CSS |
| `designer-pick-references "<query>"` | Find design references for a brief |
| `designer-record approve\|reject` | Save design decisions for next time |
| `designer-design-audit --url <url>` | Audit a running page in a real browser |
| `designer-setup --profile browser` | Install the browser pieces |
| `designer-install-agent --agent pi` | Register the skill with your agent |

Verify:

```bash
designer-doctor
```

You should see green for `runtime`, `installed` and `executable`.

---

## Prefer git? Works too

```bash
git clone https://github.com/Hari-prasanth-nagaraj/designer.git
cd designer
node scripts/doctor.mjs
```

No `npm install` needed — the core has zero dependencies.

---

## Using it without any AI agent

The tools are plain CLI programs. They work on their own.

**Lock your design system, then keep it honest:**

```bash
cd my-app
designer-design-drift . --init    # once — derives the allowed values from your tokens
designer-design-drift .           # every time (also good in CI; exits 1 on drift)
```

You get one line per bad value, plus a **rollup** that tells you the real problem:

```
✗ radius-drift — 12 findings across 4 files
  Geometry has fragmented into per-component choices.
```

**Find references for a brief:**

```bash
designer-pick-references "dental clinic scheduling for a multi-provider practice"
```

**Audit a page in a real browser** (optional):

```bash
npm i -g playwright && npx playwright install chromium
designer-design-audit --url http://localhost:3000 --out audit
```

**Remember what you decided:**

```bash
designer-record approve --project my-app --tier 3 \
  --hypothesis "dense operations console, borders over shadows" \
  --why "user recognised the domain instantly"

designer-record retrieve "operations console"    # recall it next time
```

Your records live outside the package — uninstalling never deletes them.

---

## Using it with an AI agent

The package also ships `SKILL.md` — instructions that teach an agent *how* to design.
The CLI gives an agent its instruments; the skill gives it judgement.

**With pi:**

```bash
designer-install-agent --agent pi          # dry run
designer-install-agent --agent pi --apply  # register it
```

Then in pi:

```text
/skill:designer Design an approval workflow screen for finance operators.
```

**With any other agent** (Cursor, Codex, Claude Code, Aider, Cline…) — no install
needed. Paste this:

```
Read <path-to-package>/SKILL.md and follow it for this task.
Task: <your request>.
```

Find the path with:

```bash
designer-doctor --where
```

To make it stick for a whole repo, add that snippet to your `AGENTS.md`.

---

## Optional extras

**Browser auditing** (needed only for `designer-design-audit`):

```bash
designer-setup --profile browser --apply
```

**Interactive browser via MCP** (optional, agent-dependent):

```bash
pi mcp add playwright -- npx -y @playwright/mcp@latest
```

**Million+ rows of product/UX patterns** (optional external pack — *not* bundled,
because no redistributable licence was found for it):

```bash
designer-setup --profile full --apply --packs ui-ux-pro-max
```

Without it, `designer-pick-references` still works and says so honestly.

---

## Uninstall

```bash
npm uninstall -g @hari-prasanth-nagaraj/designer
```

Your design records are kept unless you explicitly delete them.

---

## Troubleshooting

**`designer: command not found`** — npm's global bin folder isn't on your PATH.
On Windows it is usually `%APPDATA%\npm`.

**`designer-doctor` shows `BROWSER-READY !`** — expected until you run
`npx playwright install chromium`.

**It says Layer A is unavailable** — that's the optional pack. Not a fault.

**Drift checker reports hundreds of findings** — read the rollup first. It's one bad
decision, not hundreds of bugs.