# Designer — operating doc

This is the **capability rationale**: what the workflow covers and *why each piece is
the way it is*. For installation and agent wiring, read `installation.md` and
`agent-support.md`. For licensing, read `THIRD_PARTY_NOTICES.md` and
`dependencies.md`.

**Entry point:** `../SKILL.md` (portable — resolve it relative to this file).
**Package root:** the directory containing `SKILL.md`.
**Tools:** `../scripts/`, `../lib/paths.mjs`, `../data/`.

> Provenance note: this document originally described a machine-specific install under
> `~/.design-system` with skills installed in `~/.pi/agent/skills/`. It has been
> updated for the portable package layout. Where it refers to skills that are **not
> bundled** for licence reasons (`baoyu-design`, `ui-ux-pro-max`, local `craft`,
> `accessibility`, `design-analysis`), treat them as optional external capabilities —
> see `dependencies.md`.

---

## The one-paragraph version

Design intelligence lives in proven skills, not in a new prompt. `baoyu-design`
supplies the craft methodology and the design-system authoring/binding machinery;
`ui-ux-pro-max` supplies searchable product-type, palette, typography, UX-rule and
stack knowledge; `frontend-design` supplies the taste layer and the calibration list
of over-represented AI defaults; Playwright + Chrome DevTools MCP supply the live
browser that most agent workflows skip. On top of that sit four small custom pieces
that nothing upstream provides as a product-UI system: a **tier router** (so a
two-pixel change does not trigger a design sprint), a **Design Director** (one written
hypothesis before any code), a **reference selector** that ranks by contextual fit and
admits its own gaps, and a **static drift checker** that enforces the design lock
without an LLM. `awesome-design-md` + `awesome-design-skills` are vendored as a
retrieval library, never loaded wholesale.

---

## Capability matrix

`✅` = covered, no work needed · `◐` = adapted · `⬜` = custom-built

| Capability | Source of truth | State |
|---|---|---|
| Product / user-job reasoning | local `ux-personas`, `empathy-mapping`, `journey-mapping`, `cognitive-load-conversion`; `upstream/claude-design-skills/{product-designer,ux-flow-planner}` | ✅ |
| User journeys | `journey-mapping`, `ux-storyboard`; `claude-design-skills/journey-map` | ✅ |
| Information architecture | `claude-design-skills/information-architect`, `ux-map-maker` (reference) | ✅ |
| Page architecture / composition | `baoyu-design/built-in-skills/hi-fi-design.md`, `page-designer` (reference) | ✅ |
| Interaction design | `persuasive-ux`, `ux-heuristics-review`, `craft` | ✅ |
| Reference retrieval | `scripts/pick-references.mjs` → bundled `data/brand-systems` (74) + `data/style-archetypes` (67); optional `ui-ux-pro-max/products.csv` for Layer A | ⬜ |
| Design direction (Design Director) | `designer/references/design-director.md` | ⬜ |
| Design-system creation | `baoyu-design` authoring guide + `compile-design-system.mjs`; `ui-ux-pro-max --persist`; local `design-system` skill | ✅ |
| Design-system consumption | `baoyu-design/use-design-system.md` (binding `_ds_prompt.md`); project's own `DESIGN.md` | ✅ |
| Typography | `ui-ux-pro-max --domain typography`; `design-grammar.md` §2; local `design-system` | ✅ |
| Colour systems | `ui-ux-pro-max --domain color`; `design-grammar.md` §1 (OKLCH roles) | ✅ |
| Spacing | `design-grammar.md` §3 | ⬜ |
| Geometry / radius | `design-grammar.md` §4 | ⬜ |
| Surfaces | `design-grammar.md` §5 | ⬜ |
| Density | `design-grammar.md` §6 | ⬜ |
| Components | project components → shadcn MCP → custom. `ui-styling` (shadcn/Radix/Tailwind) | ✅ |
| Accessibility | local `accessibility`; `design-audit.mjs`; `design-review.md` §Phase 4 | ✅ |
| Responsive behaviour | `design-review.md` §Phase 2; `design-grammar.md` §11 template | ✅ |
| Browser inspection | **Playwright MCP** (25 tools) + **Chrome DevTools MCP** (30 tools) | ✅ |
| Screenshot review | `browser_take_screenshot`, `take_screenshot`; local `design-analysis` measures real pixels | ✅ |
| UX critique | `design-review.md` UX critic; `ux-heuristics-review`; `general-design-review` | ◐ |
| Visual / systemic critique | `design-review.md` visual critic + classification; `craft`; `huashu-design/critique-guide.md` | ◐ |
| User-flow testing | Playwright MCP `browser_*` flow driving; `design-review.md` §Phase 1 | ✅ |
| Component discovery | `grep` the project; **shadcn MCP** `search_items_in_registries` → `get_add_command_for_items` | ✅ |
| Token-drift detection | `scripts/design-drift.mjs` + `design-drift.config.json` per project | ⬜ |
| Deterministic UI audit | `scripts/design-audit.mjs` (vendored, MIT) | ✅ |
| Design evals / taste | `scripts/record.mjs` + personal store outside the checkout | ⬜ |
| Benchmarks | `evals/benchmarks/` (6 fixed briefs) + `run-benchmark.mjs` | ⬜ |
| Orchestration / tiering | `designer/SKILL.md` §0 | ⬜ |
| Human art direction | *(deferred — Onlook / Design Mode, spec Phase 7)* | ⬜ |

**Nine custom pieces, each closing a gap nothing upstream closes.** Everything else is reuse.

> **Packaging status:** these custom pieces, the vendored MIT/Apache material and the
> deterministic tools now ship in one portable package. Skills listed as *local* in this
> matrix are **not bundled** - see `dependencies.md` for licence status and how to add
> them. The workflow completes its core without them.

---

## Layout

```
~/.design-system/
├── DESIGN-SYSTEM.md         ← you are here
├── PROVENANCE.md            ← sources, licenses, versions
├── references/
│   ├── index.json           141 references, faceted + IDF-ranked
│   ├── build-index.mjs      rebuild the index after an upstream update
│   └── pick.mjs             the reference selector
├── scripts/
│   ├── design-drift.mjs     static design-lock enforcement
│   └── design-audit.mjs     vendored multi-viewport audit (MIT)
├── evals/
│   ├── record.mjs           approve / reject / retrieve / tropes
│   ├── approved/  rejected/
│   └── benchmarks/          6 fixed briefs + run-benchmark.mjs
└── upstream/                vendored, unmodified
    ├── awesome-design-md/       74 real brand DESIGN.md
    ├── awesome-design-skills/   67 style archetypes
    ├── claude-design-skills/    7 UX pipeline skills
    └── uipm-stack/              design-audit + design-review source

~/.pi/agent/skills/
├── designer/       ◀ THE ENTRY POINT
│   ├── SKILL.md                     tier router + workflow
│   └── references/
│       ├── design-director.md       the hypothesis layer
│       ├── design-grammar.md        the coupling layer
│       ├── design-review.md         7-phase two-critic review (ported)
│       └── DESIGN.md-template.md    persistence format
├── baoyu-design/            upstream, MIT
├── frontend-design/         upstream, Apache-2.0 (+ LICENSE.txt)
├── huashu-design/           local
└── impeccable-design-polish/  local (symlink repaired 2026-10-01)

~/.pi/agent/mcp.json         playwright · chrome-devtools · shadcn
~/.agents/skills/            24 pre-existing skills (ui-ux-pro-max, craft,
                             design-analysis, accessibility, ux-*, …)
```

---

## Invoking it

### In pi / Codex, conversationally

The skill triggers on its own description. You do not have to name it. Just say what
you want:

```
Design a scheduling screen for a multi-provider outpatient clinic.
```
→ Tier 3. The agent runs discovery, product reasoning, `pick.mjs`, writes a design
hypothesis, implements, opens it in the browser, reviews, and tests the flow.

```
The settings page feels generic — make it better.
```
→ Tier 2. Design Director + grammar, then the browser loop. No research phase.

```
The icon in this button is 1px off.
```
→ Tier 0. Fix it. No pipeline. The whole point of the tier router.

### Explicitly

```
Run the designer workflow, tier 4, for a new bullion trading console.
```

### The deterministic passes on any project

```bash
PKG=/path/to/designer   # the directory containing SKILL.md

# lock the project's allowlists from its own tokens (once)
node $PKG/scripts/design-drift.mjs /path/to/project --init

# check drift (CI-friendly, exit 1 on findings)
node $PKG/scripts/design-drift.mjs /path/to/project

# find references for a brief
node $PKG/scripts/pick-references.mjs "clinic scheduling for a multi-provider practice"

# deterministic browser audit
node $PKG/scripts/design-audit.mjs --url http://localhost:5173 --out audit

# run a benchmark
node $PKG/benchmarks/run-benchmark.mjs 01 --out runs/$(date +%s)

# record taste (written OUTSIDE the checkout)
node $PKG/scripts/record.mjs approve --project x --hypothesis "…" --why "…"
node $PKG/scripts/record.mjs retrieve "high density operations console"
node $PKG/scripts/record.mjs --where

# readiness — graded, never a single green tick
node $PKG/scripts/doctor.mjs --profile browser
```

### Validated reference run — Benchmark 01

`D:\tmp\meridian-terminal\` is the completed implementation of benchmark 01 (high-density bullion terminal), kept as a runnable reference rather than a new framework. With its local server running on port 4311, reproduce the validation with:

```bash
cd D:\tmp\meridian-terminal
node flow-test.mjs http://127.0.0.1:4311/index.html
node <PKG>/scripts/design-drift.mjs .
node <PKG>/scripts/design-audit.mjs --url http://127.0.0.1:4311/index.html --out audit-final
```

The final reference run is recorded in `eval/benchmark-01/`: 29/29 outcome checks
passed; source drift is clean; browser audit reports 0 high and 0 console errors. Its
one medium mobile tap-target finding is an explicit, scoped desktop-floor-terminal
waiver in `DESIGN.md`, not a silently ignored failure. The completed scorecard contains
the evidence, review findings and the negative-control result for the drift checker.

### Codex

Codex does not auto-discover pi skills. Point it at the same files — copy
`designer/SKILL.md`'s tier table into the project's `AGENTS.md`, or run
Codex with `--add-dir ~/.pi/agent/skills/designer`. The vendored upstream and
the scripts work identically under Codex (Node + Python only).

---

## How a design task actually runs

```
BRIEF
  │
  ├─ designer §0            decide the TIER, out loud, then stop loading
  │
  ├─ §1 DISCOVERY                    AGENTS.md · DESIGN.md · tokens · components
  │                                  + design-drift (what already drifts)
  ├─ §3 PRODUCT REASONING            T3+   who · job · frequency · stakes · entities
  ├─ §4 REFERENCES                   T3+   pick.mjs → Layer A + Layer B, with reasons
  ├─ §5 DESIGN DIRECTOR              T2+   ONE written hypothesis, incl. anti-patterns
  ├─ §6 DESIGN GRAMMAR               T2+   coupled tokens; persist to DESIGN.md if greenfield
  ├─ §7 COMPONENT REUSE                     project → shadcn MCP → custom
  ├─ §8 IMPLEMENT                            in the project's own stack
  │
  ├─ §9  BROWSER LOOP                      playwright MCP · 375/768/1024/1440 · console
  ├─ §10 REVIEW                            design-audit.mjs · design-drift.mjs
  │                                       + design-review.md 7 phases, 2 critics,
  │                                         classified LOCAL/COMPONENT/DESIGN-SYSTEM/DIRECTION
  ├─ §11 USER-FLOW TEST            T3+   drive the outcome, not the DOM
  └─ §12 RECORD                           scripts/record.mjs approve | reject
```

---

## Maintenance

```bash
# update vendored upstream (pinned to the tags listed in PROVENANCE.md)
git -C ~/.design-system/upstream/… pull && node ~/.design-system/references/build-index.mjs
```

Update these independently: skills (skill installer), the reference index
(`build-index.mjs`), MCP servers (`pi mcp add`).

**When an upstream project fixes something we adapted** (`design-review.md` is a port;
`design-audit.mjs` is verbatim), re-read the upstream copy in `upstream/` and re-port.
Do not silently diverge.

---

## Known limitations

1. **The reference library is marketing-site-shaped.** 74 real design systems, but it
   is `awesome-design-md` — real *websites*, not real *products*. Coverage of clinical,
   CRM and internal-ops domains is thin. `pick.mjs` reports the gap; Layer A
   (`ui-ux-pro-max`, 192 product types) covers the product-type side. The honest answer
   for a thin domain is to derive from product context, not to borrow.
2. **`design-drift.mjs` is regex, deliberately.** It cannot judge whether a colour is
   *used well*, only whether it is off-system. Judgment stays with the reviewer. It will
   also flag Tailwind's own palette classes if they appear as inline `style` values —
   that is a true positive under a strict design lock, but be ready to widen the
   allowlist deliberately rather than reflexively.
3. **No Storybook.** `storybookjs/mcp` is deferred because no project on this machine
   has one. Without it, component discovery is `grep` + shadcn.
4. **Human art direction is deferred.** Onlook / Design Mode are not installed. The
   agent can now *see* its own work, but a human cannot yet drag things around.
5. **Not a design studio.** This is a coding-agent workflow. For a standalone design
   artefact (deck, marketing page, annotated review page) `baoyu-design` is the tool;
   this system is for product UI.
