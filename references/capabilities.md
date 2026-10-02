# Capability routing — load one authority for the decision

All paths are relative to the resolved package root. Run `node <packageRoot>/scripts/knowledge.mjs` for exact available paths. File presence is not proof that the current task used a capability: record which files you actually read.

| Need / trigger | Load / execute | Authority and boundary |
|---|---|---|
| Existing-system import / binding | Project DESIGN.md, tokens, component docs; optional baoyu use-design-system.md | Existing project wins; do not start a parallel system. |
| New aesthetic direction, Tier 2–4; generic-looking work | data/frontend-design.md | Taste influence, not a substitute for the Director. Marketing/hero examples are not product-page requirements. |
| Product-type prior, Tier 3–4 | scripts/pick-references.mjs (192 bundled product types + 141 references) | Contextual evidence, not automatic palette selection. |
| Palette/type/chart/icon/stack search | Optional ui-ux-pro-max scripts/search.py, at the root reported by knowledge.mjs | Requires Python 3. Verify `python --version`; if unavailable, report the gap and derive choices from the project/context. |
| Jobs, IA and navigation, Tier 3–4 | data/ux-pipeline-skills/information-architect/SKILL.md; product-designer/SKILL.md | Select the relevant stage, not the whole pipeline. Carry assumptions/research and success criteria forward. |
| Journey / connected flows | data/ux-pipeline-skills/journey-map/SKILL.md OR ux-flow-planner/SKILL.md | Only research-supported claims; do not invent personas or call assumptions research. |
| UX review | data/ux-pipeline-skills/ux-heuristics/SKILL.md | UX lens; avoid loading a competing UX handbook for the same decision. |
| Visual/system review, craft, accessibility, robustness | references/design-review.md + grammar; scripts/design-audit.mjs | Rendered evidence, keyboard/contrast checks, systemic diagnosis. Heuristics are not WCAG certification. |
| Standalone artifact, prototype, reusable system authoring/preview | Optional baoyu-design SKILL.md / system-prompt.md and its relevant built-in guide | Don't invoke for production app implementation. Its artifacts/harness assumptions do not override the project's stack or this task's design lock. |
| Human taste / precedent | scripts/record.mjs retrieve "<task>" | Personal records only by default. Samples are not the user's preferences. |
| Browser/flow | lib/browser-runtime.mjs loadPlaywright() or live client MCP tools | Use the shared resolver in new flow scripts. If unavailable, do not claim validation. |

Designer remains the orchestrator. Bundled UX files are **selected reference stages**, not a second end-to-end engine: do not follow design-pipeline.md's missing user-researcher/accessibility-auditor stages or force its example SDS/Material Symbols conventions. Use the project's components/icon family, Director and evidence gates. If a bundled stage links to a file not shipped, report it as unavailable; use the listed authority instead.

## Optional methodology/search enrichment without a private home collection

`designer-setup --profile full` previews the browser runtime and the two pinned upstream repositories. Add `--apply` to download them to personal state. This needs npm/network, git, and sufficient disk space; it never edits MCP/agent configuration. Existing valid packs can be reused. For only one pack use `--packs baoyu-design` or `--packs ui-ux-pro-max`.

`DESIGNER_BAOYU` and `DESIGNER_UIPM` explicitly select existing pack roots; a missing explicit override is not silently substituted. Other installed skills (craft, accessibility, design-analysis) may be used as the single authority when actually present; they are not required or redistributed.

For full-profile use, confirm optional Python tooling separately and exercise MCP connections in the target client. No installer can certify third-party client invocation from file placement alone.
