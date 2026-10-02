# Designer

An evidence-driven product-UI workflow for coding agents—not an application or component framework.

**Product context → UX reasoning → references → one Design Director hypothesis → coupled grammar → component reuse → implementation → live review → flow tests → systemic fixes → personal evals.**

## Install tools, then select your agent

Published-release command (requires the package to be available on npm):

```sh
npm install -g @hariprasanth-nagaraj/designer
designer-install-agent --ai pi             # preview
designer-install-agent --ai pi --apply     # safe, complete independent copy
```

For an unreleased checkout or local tarball:

```sh
npm install -g .
# or npm install -g ./hariprasanth-nagaraj-designer-1.2.0.tgz
```

`designer-install-agent --list` lists placement conventions. No arguments previews detected configuration markers; `--ai all --apply` deliberately places files for those markers. **Neither detection nor placement proves native client compatibility.** Copy is the default. `--mode link` explicitly links to the source, falling back to a copy if links are unavailable.

Project registration: `designer-install-agent --ai claude --scope project --apply`.
Pi: reload, then `/skill:designer <brief>`. Claude Code: confirm discovery, then `/designer <brief>`.
Any client that can read local files: `designer-install-agent --print-bridge`.
This prints an instruction; it never edits AGENTS.md, settings or MCP config.

## Runtime profiles

```sh
designer-setup --profile core                # read-only preview
designer-setup --profile browser --apply     # pinned Playwright + Chromium
designer-doctor --profile browser
designer-setup --profile full                # preview browser + optional upstream packs
designer-setup --profile full --apply
```

Browser runtime, optional pack repositories, receipts and preferences live in personal
state outside the package. A single resolver is used by setup/audit/doctor and can be
imported by project flow tests. No archive lockfile or writable global package directory
is required. Full enrichment needs git/network; Python 3 is needed for ui-ux-pro-max search.

Core needs Node 20+ and no installed npm dependencies. It includes **192 product-type
priors, 74 brand systems, 67 archetypes, frontend-design taste guidance and selected UX
stages**. Full optional methodology/search can be fetched from pinned, MIT-verified
upstreams; no author's private skill collection is required.

Doctor distinguishes executable core, actual browser launch, entry-file placement,
native client discovery and MCP connectivity. A full-profile PARTIAL is not a green
readiness claim; confirm client/tool operation separately.

## Tools without an AI agent

```sh
designer-design-drift ./project --init
designer-design-drift ./project
designer-pick-references "high-density clinic schedule for practice managers"
designer-design-audit --url http://localhost:5173 --out audit
designer-record retrieve "high density operations"
designer-knowledge
designer-doctor --where
```

Drift rejects planted rogue color/radius/spacing/type/motion defects. Browser audits
are heuristic leads—not WCAG certification or an aesthetic verdict. Run outcome
tests and the rendered two-critic review before calling significant UI work complete.

## Update, migrate, uninstall safely

Managed copies are replaced only if their recorded manifest is unchanged. User edits
cause refusal. Updates stage/validate/swap and roll back ordinary failures.
Receipts are keyed by destination so user scope and multiple projects coexist.

```sh
designer-record import --from /path/to/legacy/evals             # preview
designer-record import --from /path/to/legacy/evals --apply     # copy, never delete source
designer-uninstall-agent --ai pi                              # preview
designer-uninstall-agent --ai pi --apply
npm uninstall -g @hariprasanth-nagaraj/designer
```

If multiple registrations exist, select `--scope user|project`, `--destination <path>`,
or explicitly `--all`. Edited copies and receipts are retained. Personal records
remain unless `--purge-state` is explicitly requested. npm uninstall alone does not
remove independent agent copies or personal state.

## Evidence and limits

The original Meridian benchmark passed 29 outcome checks; extraction preserved its
static/browser audit behavior. Existing tests and CI are evidence for their actual
scope, not universal client support or design-model equivalence.
See [PARITY.md](docs/PARITY.md) for release-specific closure evidence and remaining
external validation boundaries.

## Documents

- [Install](docs/INSTALL.md), [profiles/overrides](docs/installation.md)
- [Capabilities](references/capabilities.md), [agent support](docs/agent-support.md)
- [Dependencies](docs/dependencies.md), [provenance](docs/PROVENANCE.md)
- [Limitations](docs/limitations.md), [security](SECURITY.md)

Authored work: MIT. Bundled upstreams retain MIT/Apache-2.0 notices; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
