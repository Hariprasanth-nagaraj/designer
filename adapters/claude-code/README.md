# Claude Code adapter

> **Status: verify against your Claude Code version.** `doctor.mjs` reports this
> adapter as `!` (unverified) rather than claiming tested support.

## Install

Claude Code discovers skills from its own skill directories. This package targets
the shared Agent Skills-spec location:

```bash
node scripts/setup.mjs --profile browser --apply
node scripts/install-agent.mjs --agent claude-code --scope user --apply
node scripts/doctor.mjs --agent claude-code --profile browser
```

If your version expects a project-local `.claude/skills/`, either copy the package
there or use the manual bridge below.

## Use it

```
/ai-product-design Design a claims triage screen for a medical billing team.
```

Or describe the UI task normally and let the description route to it.

## MCP servers

Claude Code reads `mcpServers` entries in the same shape pi uses, but keep them in
**Claude Code's own config**, not in `~/.pi/agent/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] },
    "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"] }
  }
}
```

This package never writes another client's config for you.

## A note on the vendored review workflow

`references/design-review.md` was originally authored for Claude Code and has been
ported to be client-neutral: MCP tool names are described by capability rather than
by one client's exact prefixes, and the subagent/model invocation was removed. If
you run the two-critic review, dispatch your own two agents with your client's
mechanism.

## Uninstall

```bash
node scripts/uninstall-agent.mjs --agent claude-code --apply
```