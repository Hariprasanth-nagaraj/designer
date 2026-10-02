# Install

Two minutes. Pick the row that matches you.

| I want to… | Do this | Needs an AI agent? |
|---|---|---|
| **Check my CSS for design drift** | `npm i -g @hari-prasanth-nagaraj/designer` | **No** |
| **Find design references for a brief** | same install | **No** |
| **Record design decisions** | same install | **No** |
| **Audit a running page in a browser** | same install + `npx playwright install chromium` | **No** |
| **Get an agent to design a screen for me** | `npm i -g …` then `designer-install-agent --ai <agent>` | Yes |

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

`npm install -g` gives you the **tools**. The **skill** is one deliberate step —
only you know which agent you use.

```bash
designer-install-agent              # what did it detect?
designer-install-agent --list       # every supported agent
designer-install-agent --ai pi      # dry run for one
designer-install-agent --ai pi --apply
designer-install-agent --ai all --apply     # every detected agent
```

```
detected on this machine: universal, pi, claude, codex, cursor, gemini, opencode

  ✓ universal    Universal / Agent Skills spec  [verified]
  ✓ pi           pi                             [verified]
  ✓ claude       Claude Code                    [verified]
  ✓ codex        Codex CLI                      [verified]
  ✓ cursor       Cursor                         [unverified]
```

Then restart the agent and:

```text
/designer  Design an approval workflow screen for finance operators.
```

### Per-project install

```bash
cd my-project
designer-install-agent --ai claude --scope project --apply
```

### Supported agents

`universal` · `pi` · `claude` · `codex` · `cursor` · `gemini` · `opencode` ·
`copilot` · `windsurf` · `kilo` · `roo` · `trae` · `qoder` · `antigravity` ·
`factory` · `warp` · `aider` · `cline` · `continue` · `augment`

`universal` installs to `~/.agents/skills/` — the cross-vendor standard. **If you
aren't sure, use that one.**

Missing yours? Add it in one line of JSON, no code change:

```bash
$EDITOR "$(npm root -g)/@hari-prasanth-nagaraj/designer/data/agents.json"
```

```json
{ "id": "myagent", "label": "My Agent",
  "dirs": ["~/.myagent/skills"], "detect": ["~/.myagent"] }
```

### If the agent doesn't pick it up

Every client is different and they change. This always works — no install needed:

```
Read <path>/SKILL.md and follow it for this task.
```

```bash
designer-doctor --where    # prints the exact path
```

To make it stick for a whole repo, paste that snippet into `AGENTS.md`.

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
designer-uninstall-agent                       # what did I install?
designer-uninstall-agent --ai pi --apply
npm uninstall -g @hari-prasanth-nagaraj/designer
```

Removes only what it created, and only if you haven't edited it. Your design
records are kept unless you pass `--purge-state`.

---

## Troubleshooting

**`designer: command not found`** — npm's global bin folder isn't on your PATH.
On Windows it is usually `%APPDATA%\npm`.

**`designer-doctor` shows `BROWSER-READY !`** — expected until you run
`npx playwright install chromium`.

**It says Layer A is unavailable** — that's the optional pack. Not a fault.

**The agent doesn't see `/designer`** — run `designer-doctor --where` and use the
manual bridge. Client skill support varies and changes between versions.

**Skill already exists** — the installer refuses to overwrite anything it didn't
create, and exits with an error. Rename or remove the old one first.

**Drift checker reports hundreds of findings** — read the rollup first. It's one bad
decision, not hundreds of bugs.