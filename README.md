# Designer

**Stop designing by vibes. Check it instead.**

Two things in one package:

1. **A skill** — instructions that teach an AI agent how to make design decisions.
2. **Tools** — plain CLI programs that check those decisions stayed consistent.

The tools work on their own. You do not need an AI agent, a build step, or an account.

```bash
npm install -g @hari-prasanth-nagaraj/designer
designer-doctor
```

That is the whole core install. Node 20+ and nothing else.

---

## Try it in 30 seconds

```bash
cd my-app
designer-design-drift . --init    # learn your design system from your own tokens
designer-design-drift .           # find where your UI has drifted
```

```
✗ radius-drift — 12 findings across 4 files
  Geometry has fragmented into per-component choices. Collapse to the declared
  radius family and map component roles onto it.
```

One rollup line, because **200 radius findings is one bad decision, not 200 bugs.**

More:

```bash
designer-pick-references "dental clinic scheduling"   # ranked design references
designer-record approve --project x --why "…"         # remember decisions
designer-design-audit --url http://localhost:3000     # audit a real page
```

Full guide: **[docs/INSTALL.md](docs/INSTALL.md)** · no agent needed.

---

## Using it with an AI agent

The tools give an agent instruments. The skill gives it judgement. Full guide:
**[docs/INSTALL.md](docs/INSTALL.md#using-it-with-an-ai-agent)**.

```bash
designer-install-agent --agent pi --apply
```

```text
/skill:designer Design an approval workflow screen for finance operators.
```

Any other agent (Cursor, Codex, Claude Code, Aider…) needs no install — just point it at `SKILL.md`.

---

## What the skill part actually does

An **evidence-driven product-UI design workflow for coding agents**.

Not an application. Not a CSS framework. Not a component library. It is one portable
skill plus the deterministic tools that make a design decision stick — and the
browser evidence that proves it did.

```
BRIEF
  │
  ├─ §0  tier router              decide the depth of work, out loud
  ├─ §1  environment discovery    what system, stack and components already exist?
  ├─ §3  product reasoning        who, what job, how often, what does a mistake cost?
  ├─ §4  reference selection      rank by contextual fit; admit its own gaps
  ├─ §5  DESIGN DIRECTOR          ONE written hypothesis, incl. anti-patterns
  ├─ §6  design grammar           coupled tokens → LOCK it mechanically
  ├─ §7  component reuse          project → registry → adapt → custom (justify last)
  ├─ §8  implement                in the project's own stack
  │
  ├─ §9  browser loop             serve over HTTP → screenshot → console
  ├─ §10 review                   audit + drift, classified to the right layer
  ├─ §11 USER-FLOW TEST           drive the outcome, not the DOM
  └─ §12 record                   approve / reject, stored outside the repo
```

## Why this exists

Agents write plausible UI. Plausible is not coherent, and plausible is not verified.
Three failure modes this package is built against:

| Failure | Countermeasure |
|---|---|
| A two-pixel change triggers a design sprint | §0 tier router |
| Every screen drifts into a different product | §5 Director + §6 grammar + `design-drift.mjs` |
| "Looks fine" declared without looking | §9 browser loop + §11 flow test + honest reporting |

## Requirements

- **Node.js 20+** — the core needs nothing else.
- A coding agent that can read files and run shell commands — **only** for the skill half.

## Install

```bash
# tools only — no agent, no build step
npm install -g @hari-prasanth-nagaraj/designer

# or from source
git clone https://github.com/Hari-prasanth-nagaraj/designer.git
cd designer

# browser extras (optional)
node scripts/setup.mjs --profile browser --apply
node scripts/install-agent.mjs --agent pi --apply   # register the skill
node scripts/doctor.mjs --profile browser
```

`doctor.mjs` prints a **graded** verdict, not a single green tick:

| Layer | Meaning |
|---|---|
| `INSTALLED` | required files and licences present |
| `EXECUTABLE` | reference selection, drift and eval store actually run |
| `BROWSER-READY` | a real browser launched, rendered and captured |
| `AGENT-READY` | that agent discovers the skill |
| `MCP-OPERATIONAL` | ⚠️ **never claimed automatically** — a config entry is not a working connection |
| `PARTIAL` | an explicit, named limitation |

Anything marked `!` is a declared limitation, not a silent success. **Do not claim a
capability the doctor could not verify.**

## Use it

In pi:

```text
/skill:designer Design an approval workflow screen for finance operators.
```

Or just describe the work — the skill's description routes product-UI requests to it:

```text
This settings page feels generic. Make it better.
```

In any other file-capable agent (Cursor, Aider, Codex, Cline, …):

```
Read <path>/designer/SKILL.md and follow it for this task.
Task: <your product-UI brief>.
```

See `adapters/` for per-agent detail: **`pi`** (primary), `codex`, `claude-code`,
`generic`.

## The tools

Globally installed as `designer-*`; from source as `node scripts/*.mjs`.

| Command | Purpose |
|---|---|
| `designer-doctor` | check what's working — start here |
| `designer-design-drift <project>` | static design-lock enforcement. `--init` derives the allowlist from your own `--space-*` / `--radius*` tokens. |
| `designer-design-audit --url <url>` | multi-viewport heuristic audit: overflow, focus, tap targets, accessible names, contrast, console |
| `designer-pick-references "<query>"` | rank 141 bundled references by fit; reports coverage gaps instead of guessing |
| `designer-record approve\|reject` | the taste layer — records what earned its place |
| `designer-benchmark <id>` | run a fixed brief, score it on 12 dimensions |

### Drift checking is the part most systems skip

```bash
designer-design-drift ./my-app --init   # once
designer-design-drift ./my-app          # every change, and in CI
```

It exits non-zero and prints a **systemic rollup** first: *200 radius findings is one
bad decision, not 200 bugs.*

It also has a negative control in `tests/fixtures/drift-bad/` that **must** be
rejected. A checker that cannot fail is worse than no checker — the test suite fails
the build if that fixture ever starts passing.

## Bundled reference data

| Dataset | Entries | Licence |
|---|---|---|
| `data/brand-systems/` | 74 real design systems | MIT (VoltAgent) |
| `data/style-archetypes/` | 67 style archetypes | MIT (Bergside) |
| `data/ux-pipeline-skills/` | 7 UX pipeline skills | MIT (Rich Hemsley) |
| `data/frontend-design.md` | AI-default calibration guidance | Apache-2.0 |

### Deliberately NOT bundled

`ui-ux-pro-max`, `baoyu-design`, `craft`, `accessibility` and `design-analysis` are
**excluded because no redistributable licence was found** in the installed copies
used to build this package. Bundling them without permission would be a violation.

They are therefore **optional external packs**, and the core degrades honestly when
they are absent:

```
LAYER A — product-type intelligence
  (unavailable: ui-ux-pro-max is an optional external pack and is not installed)
  This is an OPTIONAL pack. Without it, derive product-type decisions from
  product context and Layer B. Do not treat Layer B alone as product-type truth.
```

See `docs/dependencies.md` for how to add them yourself.

## Your data stays yours

Eval records and install receipts live in an OS-appropriate state directory
(`%LOCALAPPDATA%`, `~/Library/Application Support`, `$XDG_STATE_HOME`) — **never inside
the checkout**. Updating or deleting this repo cannot destroy your design history.

```bash
node scripts/record.mjs --where
```

## Uninstall

```bash
npm uninstall -g @hari-prasanth-nagaraj/designer
```

Removes only what the installer created, refuses to follow a symlink into your
checkout, keeps your eval records unless you pass `--purge-state`.

## Docs

| File | Covers |
|---|---|
| `docs/INSTALL.md` | **start here** — 2-minute install, with or without an agent |
| `docs/installation.md` | detailed install, platform prerequisites, offline use |
| `docs/dependencies.md` | every dependency, licence status, how to add the excluded packs |
| `docs/agent-support.md` | support matrix — what is *tested* vs *documented* |
| `docs/limitations.md` | what this package does not do |
| `docs/PROVENANCE.md` | sources and adaptations, with the licence verification that produced it |
| `SECURITY.md` | what each script touches on your machine |

## Licence

Authored code and documentation: **MIT**. Bundled third-party material: its own
licence — see `THIRD_PARTY_NOTICES.md` and `licenses/upstream/`.