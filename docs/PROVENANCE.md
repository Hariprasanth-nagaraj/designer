# Provenance

Vendored third-party material. Every item was cloned from its canonical upstream
repository (not a fork), license rechecked at vendoring time, and left unmodified
except where noted under "Adaptations".

---

## baoyu-design — INSTALLED as an agent skill

- Source: https://github.com/JimLiu/baoyu-design
- Path: `~/.pi/agent/skills/baoyu-design/`
- License: MIT (© 2026 Jim Liu 宝玉) — `LICENSE` shipped inside the skill
- Used for: design methodology + craft standard (`system-prompt.md`), design-system
  authoring (`built-in-skills/design-system-authoring-guide.md`,
  `create-design-system.md`) and binding consumption (`use-design-system.md`),
  deterministic design-system validation (`agents/check-design-system.mjs`),
  preview build (`agents/build-preview.mjs`), Figma import (`agents/import-figma.mjs`),
  starter components, harness reference (`references/codex.md`).
- Adaptations: **none.** Files copied verbatim.
- Its `built-in-skills/frontend-design.md` is a condensed derivative and is
  superseded for the taste layer by the Anthropic skill below.

## anthropics/skills → frontend-design — INSTALLED as an agent skill

- Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Path: `~/.pi/agent/skills/frontend-design/`
- License: **Apache-2.0** — `LICENSE.txt` shipped verbatim alongside `SKILL.md`.
  Apache-2.0 §4 requires retaining notices; the license file is present, do not remove.
- Used for: the aesthetic-direction / taste layer, specifically its calibration list
  of over-represented AI defaults (cream+serif+terracotta, near-black+acid accent,
  hairline broadsheet) and its "one or two type families, not per-component fonts" rule.
- Adaptations: **none.**

## nextlevelbuilder/ui-ux-pro-max-skill — ALREADY INSTALLED (not re-vendored)

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Path: `~/.agents/skills/ui-ux-pro-max/`
- License: MIT
- The locally installed copy is **newer and larger** than upstream HEAD (3.7 MB,
  includes `data/stacks/*.csv` for 22 stacks and the `--variance/--motion/--density`
  dials). Upstream was inspected, not installed, to avoid a downgrade.
- The upstream `stack/` subtree (Claude Code website-design stack) is vendored
  separately below.

## ui-ux-pro-max `stack/` subtree — VENDORED + ADAPTED

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/stack
- Path: `~/.design-system/upstream/uipm-stack/`
- License: MIT (`package.json` `license: MIT`; repo LICENSE)
- Used for: `scripts/design-audit.mjs` (multi-viewport screenshots + overflow,
  unsized-media, focus-style, tap-target, accessible-name, heading-order,
  viewport/lang, console and approximate-contrast heuristics) and
  `.claude/agents/design-review.md` (the 7-phase browser review).
- Adaptations:
  - `design-audit.mjs` copied **verbatim**; the only change is that its optional
    `playwright` dependency is resolved from the system install instead of a local
    `node_modules` (see `~/.design-system/scripts/design-audit.mjs` header).
  - `design-review.md` is **ported**, not copied, into the
    `designer` skill: `mcp__playwright__*` / `mcp__chrome-devtools__*`
    tool names are replaced with the pi equivalents, and the Claude-Code-specific
    `model: sonnet` / subagent invocation is dropped.
  - `README.md` / `CLAUDE.md` are kept for provenance only; the operative workflow
    lives in `~/.design-system/DESIGN-SYSTEM.md`.

## VoltAgent/awesome-design-md — VENDORED as a reference library

- Source: https://github.com/VoltAgent/awesome-design-md
- Path: `~/.design-system/upstream/awesome-design-md/design-md/` (73 brand DESIGN.md files)
- License: MIT (© 2026 VoltAgent)
- Used for: reference retrieval only. Accessed through
  `scripts/pick-references.mjs` from `data/`, never loaded wholesale into context.
- Adaptations: **none** (`.git` stripped).
- `DESIGN.md` is also the Google Stitch design-agent convention, so a vendored file
  can be dropped into a project root as-is.

## bergside/awesome-design-skills — VENDORED as an archetype library

- Source: https://github.com/bergside/awesome-design-skills
- Path: `~/.design-system/upstream/awesome-design-skills/skills/` (68 archetypes)
- License: MIT (© 2026 Bergside)
- Used for: style/archetype reference, same as above. Most archetypes are
  marketing-oriented; they are for Tier 3–4 work, not for dense product UI.
- Adaptations: **none.** The 12 MB of `registry-examples/*.png` marketing previews
  were intentionally **not** vendored — the markdown carries the same information.

## richhemsley3/claude-design-skills — VENDORED (selective subset)

- Source: https://github.com/richhemsley3/claude-design-skills
- Path: `~/.design-system/upstream/claude-design-skills/`
- License: MIT (© 2026 Rich Hemsley)
- Subset taken: `product-designer`, `information-architect`, `ux-flow-planner`,
  `design-critique`, `ux-heuristics`, `journey-map`, `design-pipeline`.
- **Deliberately excluded** to avoid skill stacking: `user-researcher`
  (overlaps local `ux-research-methods` / `empathy-mapping` / `ux-personas`),
  `design-reviewer` (overlaps the ported `design-review` + local
  `general-design-review` + `ux-heuristics-review`), `accessibility-auditor`
  (overlaps local `accessibility`), `ux-map-maker`, `component-builder`,
  `content-copy-designer`, `qa-specialist`, `wireframe-agent`,
  `interactive-flow-diagram`, `screen-flow-diagram` (baoyu covers these).
- Adaptations: **none.** Referenced in place, not copied into a skill.

## Hitbullets/codex-skills — REFERENCE ONLY, not vendored

- Source: https://github.com/Hitbullets/codex-skills
- License: not retained (nothing copied)
- Inspected and rejected as an install target: its bundled `ui-ux-pro-max` is a
  ~12 KB prose rewrite, strictly worse than the 3.7 MB searchable install we already
  have. Its one useful idea — an `AGENTS.md` trigger table with lazy skill loading —
  is implemented in `designer/SKILL.md` as the tier table.

---

## MCP servers (installed, not vendored)

| Server | Package | License |
|---|---|---|
| Playwright | `@playwright/mcp` (npx) | Apache-2.0 |
| Chrome DevTools | `chrome-devtools-mcp` (npx) | Apache-2.0 |
| shadcn | `https://ui.shadcn.com/mcp` (remote HTTP) | MIT |

Configured in `~/.pi/agent/mcp.json`.

## Not installed, and why

| Project | Reason |
|---|---|
| `attentiondotnet/open-design` | Design-studio shell. `baoyu-design` already is the portable methodology + design-system compiler it wraps. A second engine is the "skill stacking" failure mode (spec §38). |
| `OpenCoworkAI/open-codesign` | Same. |
| `imsai-sh/open-claude-design` | Self-identifies as pre-alpha. Spec §6.3 says research only. |
| `onlook-dev/onlook` | Human visual art-direction. Spec Phase 7; needs a running app; no bearing on the core loop yet. |
| `SandeepBaskaran/design-mode` | Same as Onlook. |
| `azu/design-loop` | Claude-Code-shaped; conceptually covered by the ported design-review loop. |
| `storybookjs/mcp` | No project on this machine has Storybook. Enable per-project when one appears. |
