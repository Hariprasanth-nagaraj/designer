# Agent support matrix

**Portable means the workflow travels, not that every agent behaves identically.**
Skill discovery, slash commands, MCP configuration and permissions all differ by
client. This file separates what is *tested* from what is merely *documented*.

| Agent | Adapter | Skill discovery | Slash command | MCP | Status |
|---|---|---|---|---|---|
| pi | `adapters/pi/` | native, user skill dir | `/skill:designer` | `mcp.json` | **primary** |
| Codex | `adapters/codex/` | manual bridge (native path unverified) | none | TOML | documented, **verify** |
| Claude Code | `adapters/claude-code/` | `~/.agents/skills` | `/designer` | own config | documented, **verify** |
| Cursor, Aider, Cline, others | `adapters/generic/` | manual bridge | none | per client | **works by construction** |

## The one thing that matters for any agent

The skill is **portable and self-contained**. Every path inside `SKILL.md` is relative
to its own location. There is no install-specific absolute path, no home-directory
assumption, and no dependency on another user's skill collection.

So any agent that can read a file and run a command can use it:

```
Read <absolute-path>/designer/SKILL.md and follow it for this task.
Task: <your product-UI brief>.
```

If that works, the agent works. Everything else is ergonomics.

## What explicit loading does and does not do

Explicit invocation (`/skill:name <brief>`, or an equivalent read instruction) makes
the workflow **available and guaranteed loaded** for that request. It does not:

- install the agent or supply credentials
- bypass permission prompts
- guarantee the model follows every step

That is a property of the agent, not of this package.

## Tier capability expectations

| The agent can… | Then the workflow reaches… |
|---|---|
| read files + shell | Tier 0–4 reasoning, grammar, drift checks, reference selection, evals |
| drive a browser / screenshot | additionally browser review and user-flow testing |
| run long test scripts | additionally scripted, re-runnable flow assertions |

**If the agent cannot drive a browser, it must say so.** `SKILL.md` §9 and §13 require
stating which checks could not run. An unverified claim is treated as a defect, not a
result.

## Honest capability reporting

`doctor.mjs` never reports `MCP-OPERATIONAL` from a config file. A registered MCP
entry is `!` until you confirm with your agent's own MCP command:

```bash
pi mcp list      # actually connects; reports tool counts and errors
```

Within pi, `/mcp` shows connection state, tool count and the tail of a failing server's
stderr.

## Adding an adapter

If you verify native integration for another agent, add `adapters/<name>/README.md`
stating exactly what you tested, then extend the doctor:

```js
// scripts/doctor.mjs — AGENTS map
"<agent-key>": { label: "<Display Name>", adapter: join(paths.adapters, "<agent-key>"), needsRegistration: true }
```

Keep `needsRegistration: true` for anything you cannot verify from a script. It is
better to report `!` than to claim a support level you have not tested.
