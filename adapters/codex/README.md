# Codex adapter

> **Status: needs verification against your Codex version before you trust it.**
> This adapter documents the intended integration. `doctor.mjs` reports Codex
> registration as `!` (unverified) rather than claiming support it has not tested.
> If the paths below do not match your Codex build, use the **manual bridge** —
> it always works.

## What is true

- Codex does **not** automatically scan pi's `~/.pi/agent/skills` directory.
- Giving Codex filesystem access to the folder (e.g. `--add-dir`) makes the files
  *reachable*, but it does **not** establish skill discovery or a slash command.
  This is the single most common misassumption about this integration.

## Option A — manual bridge (always works, recommended until verified)

Codex reads `AGENTS.md` from the project root. Add a short pointer — do **not**
copy the whole methodology into it, or it will drift from `SKILL.md`:

```markdown
## Product UI work

When asked to design, build, change, or review any interface, screen, component,
workflow, or design system, first read the Designer workflow and follow it:

    <ABSOLUTE_PATH>/designer/SKILL.md

Resolve its supporting files relative to that directory. It includes a task tier
router, a Design Director step, a coupled design grammar, contextual reference
selection, static drift checking, browser review, and user-flow testing.

Standalone commands (Node 20+, no agent integration needed):

    node <PKG>/scripts/design-drift.mjs <projectRoot>
    node <PKG>/scripts/pick-references.mjs "<product + user + task>"
    node <PKG>/scripts/design-audit.mjs --url http://localhost:PORT --out audit

Your own repo's tokens, components and DESIGN.md always win over this package.
```

Then in a session:

```text
Read <ABSOLUTE_PATH>/designer/SKILL.md and follow it for this task:
Design an approval workflow screen for finance operators.
```

This is also the correct answer for **any** file-capable coding agent. See
`../generic/README.md`.

## Option B — native skill location (verify first)

If your Codex version documents its own skill directory, copy or link the whole
package there:

```bash
node scripts/install-agent.mjs --agent codex --scope user --apply
```

This targets `~/.agents/skills/designer`, which is the shared
Agent Skills-spec location. Then confirm Codex actually discovers it — do not
assume the file placement was enough.

## MCP servers for Codex

Codex uses TOML, not `mcp.json`. Add equivalent entries to Codex's own MCP config:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest"]

[mcp_servers.chrome-devtools]
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest"]
```

This package does **not** write to your Codex config. It prints a recommended
snippet and leaves the merge to you, because Codex config edits outside a project
are yours to control.

## Browser capability

If Codex cannot run a browser, the core workflow still applies — but say so
explicitly and do not claim browser or flow validation. `scripts/design-audit.mjs`
works from any terminal regardless of agent.

## Uninstall

```bash
node scripts/uninstall-agent.mjs --agent codex --apply
```