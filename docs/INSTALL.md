# Install Designer

See README.md for npm, local-checkout and tarball installation commands. npm puts
tools on PATH; it does not register a skill or configure MCP.

1. Install package tools.
2. Preview placement: `designer-install-agent --ai <id>`.
3. Apply: `designer-install-agent --ai <id> --apply`.
4. Reload client and verify it loads Designer.
5. Preview browser setup; add --apply to install it.
6. Run `designer-doctor --profile core` or `--profile browser`.
7. For the original expanded methodology/search environment, explicitly run
   `designer-setup --profile full --apply` and verify Python/client tools.

Agent choices: `designer-install-agent --list`. No arguments previews detected
configuration markers; --ai all deliberately selects them. These are placement
conventions, not certification. Pi's command is /skill:designer. Claude Code's is
/designer after discovery. Use --print-bridge with any file-reading client.

User scope is default. Project scope places files in the requested client's project
skills directory. No settings/AGENTS.md/MCP overwrite. Copy is default; --mode link
is opt-in. Edited and foreign destinations are refused, including during updates.

Uninstall the selected agent registration before removing npm tools. User/project
receipts coexist; use --destination when selecting a registration from another cwd.
Preserve edits manually rather than passing a destructive force flag.

Browser setup works from npm archives and independent skill copies. It installs
pinned dependencies into personal state; npx playwright install by itself is not a
substitute for an importable runtime. Offline core works with bundled data. Browser
and full enrichment downloads require network. Linux browser system libraries may
need administrator-managed installation; Designer never installs them with sudo.

See installation.md for overrides, dependencies.md for pinned packs and PARITY.md
for the distinction between tested behavior and unexercised client compatibility.
