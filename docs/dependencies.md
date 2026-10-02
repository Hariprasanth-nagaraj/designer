# Dependencies

Every dependency the workflow relies on, with its **licence status as verified** in the
installed copies, not as claimed upstream.

## Verification method

Each installed copy was checked for an actual `LICENSE` / `LICENSE.txt` file and for
any licence or copyright statement in its own text. **A `package.json` `"license"`
field alone was not treated as sufficient** for material already copied from that
project.

## Bundled — licence verified, safe to redistribute

| Capability | Component | Where | Licence | Verified by |
|---|---|---|---|---|
| Brand-language references | VoltAgent/awesome-design-md | `data/brand-systems/` | MIT © 2026 VoltAgent | `LICENSE` file present |
| Style archetypes | Bergside/awesome-design-skills | `data/style-archetypes/` | MIT © 2026 Bergside | `LICENSE` file present |
| UX pipeline skills | RichHemsley3/claude-design-skills | `data/ux-pipeline-skills/` | MIT © 2026 Rich Hemsley | `LICENSE` file present |
| AI-default calibration | anthropics/skills → frontend-design | `data/frontend-design.md` | Apache-2.0 | `LICENSE.txt` present; notice retained per §4(d) |

## Authored from an upstream source

| File | Origin | Status |
|---|---|---|
| `scripts/design-audit.mjs` | `ui-ux-pro-max` `stack/` subtree | Copied verbatim from the vendored local copy. That snapshot declared `"license": "MIT"` in its `package.json` but contained **no LICENSE file** — flagged in `THIRD_PARTY_NOTICES.md` rather than asserted as verified. |
| `references/design-review.md` | same subtree | **Ported, not copied**: MCP tool names made client-neutral; the Claude-Code-specific model/subagent invocation removed. |

If you are the author of that `stack/` subtree and intend it to be redistributable,
add a LICENSE file upstream and this can be upgraded to a verified claim.

## NOT bundled — no redistributable licence found

These are real dependencies of the workflow. They were **excluded on licence grounds**,
not for convenience.

| Component | Provides | Evidence found |
|---|---|---|
| `ui-ux-pro-max` | Layer A product-type intelligence (192 product types), palette/type/stack search | no `LICENSE` file; no licence statement in `SKILL.md` |
| `baoyu-design` | craft methodology, design-system authoring and binding | no `LICENSE` file; no licence or copyright notice anywhere in the tree |
| `craft` | visual-craft / anti-slop rules | no `LICENSE` file |
| `accessibility` | WCAG review checklist | no `LICENSE` file |
| `design-analysis` | measured design facts from a live page | no `LICENSE` file |

### How this affects the workflow

Nothing breaks. The system was designed so the core stands alone:

- **Reference selection Layer A** reports itself unavailable and says to derive
  product-type decisions from product context. It never fabricates a match.
- **Reference selection Layer B** (141 bundled references) is always available.
- **Design Director, grammar, drift checking, audit and flow testing** need nothing
  from the excluded set.
- The taste guidance was inlined into this package (`data/frontend-design.md`)
  precisely so the "avoid AI defaults" layer is not lost.

### Adding them yourself

Install from their canonical sources, then point this package at them:

```bash
node scripts/setup.mjs --profile full --apply --packs ui-ux-pro-max,baoyu-design
```

Or set paths directly:

```bash
# Linux / macOS
export DESIGNER_UIPM=/path/to/ui-ux-pro-max
export DESIGNER_BAOYU=/path/to/baoyu-design

# Windows PowerShell
$env:DESIGNER_UIPM = "D:\path\to\ui-ux-pro-max"
$env:DESIGNER_BAOYU = "D:\path\to\baoyu-design"
```

The package also finds them in common agent skill directories — `~/.agents/skills`,
`~/.pi/agent/skills`, `~/.claude/skills` — with no configuration needed.

**Install them at your own risk and under their own terms.** They are not covered by
this package's MIT licence.

## Optional MCP servers (user-installed, never bundled)

| Server | Package | Licence | Why |
|---|---|---|---|
| Playwright MCP | `@playwright/mcp` | Apache-2.0 | interactive browser control |
| Chrome DevTools MCP | `chrome-devtools-mcp` | Apache-2.0 | network / performance inspection |
| shadcn MCP | `shadcn` | MIT | component discovery — **only** if the project already uses shadcn |

These are separate processes with network access, installed under your own account.
`doctor.mjs` will **never** report one as working from a config file alone.

## Runtime dependencies

| Package | Range | Why | Required? |
|---|---|---|---|
| `playwright` | pinned `1.63.0`, `devDependencies` | `design-audit.mjs` and scripted flow tests | only for the `browser` profile |

Declared as a devDependency deliberately: this is a workflow package, not an
application, so the core must run with **zero** installed packages.

## Reproducibility

`dependencies.lock.json` records a SHA-256 prefix for every authored file plus file
counts and byte sizes for each bundled dataset. It exists so a reviewer can confirm
exactly what shipped, and so an upstream change is visible as a diff rather than a
silent behaviour change.

To re-verify a bundled dataset against upstream:

```bash
git clone --depth 1 https://github.com/VoltAgent/awesome-design-md /tmp/upstream
diff -r /tmp/upstream/design-md ./data/brand-systems
```