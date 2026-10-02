# Generic / manual adapter

Use this for **any** coding agent that can read files and run shell commands —
Cursor, Aider, Cline, Windsurf, OpenHands, Continue, or anything else.

This is the most portable path in the package. It has no client-specific
registration, so it cannot break when a client changes its skill format.

## The one-line bridge

```
Read <ABSOLUTE_PATH>/ai-product-design/SKILL.md and follow the ai-product-design
workflow for this task. Resolve its supporting files relative to that directory.
Task: <your product-UI brief>.
```

`SKILL.md` is self-contained and portable: every path in it is relative to its own
location, and it never assumes a home directory or a fixed install path.

## Project-level integration (sticky, no agent changes)

Drop a pointer into the project's `AGENTS.md` (or `CLAUDE.md`, or whatever the
agent reads) so every future session in that repo uses the workflow. Keep it a
**pointer, not a copy** — a copy will drift from `SKILL.md`.

```markdown
## Product UI work

For any request to design, build, change, or review an interface, screen,
component, workflow, or design system:

1. Read `<ABSOLUTE_PATH>/ai-product-design/SKILL.md` and follow it.
2. Resolve its references, scripts and data relative to that directory.
3. This repo's own `DESIGN.md`, tokens and components always win over the
   package defaults — it extends, never replaces, your system.

Useful commands (Node 20+):

    node <PKG>/scripts/design-drift.mjs <projectRoot>          # what already drifts
    node <PKG>/scripts/design-drift.mjs <projectRoot> --init   # once, derive allowlist
    node <PKG>/scripts/pick-references.mjs "<product + user + task>"
    node <PKG>/scripts/design-audit.mjs --url http://localhost:PORT --out audit
```

## Generate the snippet with the correct path

```bash
node scripts/install-agent.mjs --agent generic --print-bridge
```

## Capability expectations

| The agent can… | Then… |
|---|---|
| read files + run shell | full workflow, including drift checking and reference selection |
| also drive a browser / take screenshots | additionally: browser review and user-flow testing |
| only read files | reasoning, Design Director, grammar, review criteria — and you must state that browser checks did not run |

**Be honest about the tier you actually reached.** An agent without a browser can
still produce excellent design reasoning, but it cannot verify a rendered page.
The skill instructs the agent to declare unrun checks rather than imply success.

## API-only assistants

An assistant with no filesystem and no shell access cannot run this package. It
needs an external integration (an MCP server, a tool runner, or a human executing
the commands and relaying output). This is a documented limitation, not a bug.

## Uninstall

Nothing is registered outside the files you added, so removal is manual: delete the
`AGENTS.md` block, and run
`node scripts/uninstall-agent.mjs --agent generic --apply` if you used the
installer.