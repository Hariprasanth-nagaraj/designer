# Agent support boundaries

data/agents.json is the single placement registry shared by install, uninstall and
doctor. Aliases: --agent is equivalent to --ai; claude-code maps to claude; generic
maps to universal. --print-bridge is a read-only universal fallback.

| Evidence | Claim allowed |
|---|---|
| Configuration marker exists | Directory/config marker detected |
| Valid SKILL.md is placed | Entry files present |
| Client lists/loads that skill | Discovery verified in that client/version |
| Client executes a task with it | Invocation/flow verified |
| MCP tools respond successfully | That connection/tool operation verified |

Do not promote one row into the next. Doctor checks valid entry files and reports
native discovery/MCP as PARTIAL; it never starts an LLM session or edits client config.

Current pi session discovery was observed for the earlier copied version. This is
not certification of every registry client or release. Pi uses /skill:designer;
Claude Code uses /designer once it discovers the skill. Other clients should use
their documented discovery mechanism or the manual read-file bridge.

User placement and project placement are explicit. Several registry paths are
conventions rather than client-tested locations. If a client version doesn't load
one, use the bridge; do not treat creation of that directory as supported loading.
Project trust and reading permissions remain client-controlled.

MCP servers are independently installed/configured by the owner. Recommended
packages: @playwright/mcp, chrome-devtools-mcp, and shadcn MCP (stdio npx -y shadcn@latest mcp)
when a project already uses shadcn. Verify tools in the target client, not from config.
