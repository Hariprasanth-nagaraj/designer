# pi adapter

pi is the **primary supported agent** for this package.

## Install

```bash
node scripts/setup.mjs --profile browser --apply
node scripts/install-agent.mjs --agent pi --scope user          # dry run first
node scripts/install-agent.mjs --agent pi --scope user --apply
node scripts/doctor.mjs --agent pi --profile browser
```

This registers the skill in your user skill directory:

- Windows: `%USERPROFILE%\.pi\agent\skills\ai-product-design`
- macOS / Linux: `~/.config/pi/agent/skills/ai-product-design`

Then **restart pi or run `/reload`**.

## Alternative: native pi package install

If you prefer pi to own the install rather than copying/symlinking:

```bash
pi install git:github.com/<owner>/ai-product-design@v1.0.0
pi list          # confirm it registered
```

This works because the repository ships a `pi` manifest in `package.json`:

```json
"pi": { "skills": ["."] }
```

Review the source before installing a third-party package — pi packages can
include skills that instruct the model to run programs.

For a one-off trial without registering anything:

```bash
pi --skill /path/to/ai-product-design -- "Design a clinic scheduling screen."
```

## Use it

Explicit and guaranteed:

```text
/skill:ai-product-design Design a billing approval workflow for finance operators.
```

Or automatically — just describe the UI task. The skill's description is designed
to route product-UI work to it.

## MCP servers (optional, recommended)

Browser review is much better with an interactive browser. pi reads MCP servers
from `~/.pi/agent/mcp.json`.

Add them yourself, or let the installer merge them for you (it never replaces
your file wholesale and never touches unrelated entries):

```bash
pi mcp add playwright        -- npx -y @playwright/mcp@latest
pi mcp add chrome-devtools   -- npx -y chrome-devtools-mcp@latest
pi mcp add shadcn            -- npx -y shadcn@latest mcp
pi mcp list                  # actually connects and reports tool counts
```

Note the shadcn server is a **stdio** command (`npx -y shadcn@latest mcp`), not a
URL. After changing MCP config, run `/reload`.

If you already have Playwright's Node library installed via the `browser` profile,
you do **not** need the MCP server — `scripts/design-audit.mjs` and a scripted
flow test cover the deterministic passes on their own.

## Uninstall

```bash
node scripts/uninstall-agent.mjs --agent pi --apply
```

This removes only what the installer created, refuses to follow a symlink into
your checkout, and keeps your personal eval records unless you pass
`--purge-state`.