# Third-Party Notices

This package redistributes material from the projects below. Each retains its own
licence. Full licence texts are in `licenses/upstream/`.

## Bundled material

| Component | Where it lives here | Source | Licence | Modifications |
|---|---|---|---|---|
| 74 brand `DESIGN.md` design systems | `data/brand-systems/` | https://github.com/VoltAgent/awesome-design-md | MIT © 2026 VoltAgent | none (`.git` stripped) |
| 67 style archetypes | `data/style-archetypes/` | https://github.com/bergside/awesome-design-skills | MIT © 2026 Bergside | none (marketing preview images intentionally not vendored) |
| UX pipeline skills (7) | `data/ux-pipeline-skills/` | https://github.com/richhemsley3/claude-design-skills | MIT © 2026 Rich Hemsley | none; selected subset only |
| `frontend-design` guidance | `data/frontend-design.md` | https://github.com/anthropics/skills/tree/main/skills/frontend-design | Apache-2.0 | none |

### Apache-2.0 attribution — `data/frontend-design.md`

Licensed under the Apache License, Version 2.0. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0. Unless required by
applicable law or agreed to in writing, software distributed under the License
is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See `licenses/upstream/frontend-design/LICENSE.txt`
for the full text. This NOTICE file satisfies the Apache-2.0 §4(d) obligation
to retain attribution notices.

## Authored from an upstream source

| File | Origin | Upstream | Licence | Adaptation |
|---|---|---|---|---|
| `scripts/design-audit.mjs` | multi-viewport heuristic audit | `ui-ux-pro-max` `stack/` subtree (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), MIT | MIT | Copied verbatim from the local vendored copy. Only the `playwright` resolution differs (resolved from the package install). The snapshot's `package.json` declares `"license": "MIT"`; **no LICENSE file was present in that snapshot** — see docs/PROVENANCE.md § Licence verification. |
| `references/design-review.md` | 7-phase two-critic browser review | same `ui-ux-pro-max` `stack/` subtree, MIT | MIT | **Ported, not copied.** MCP tool names made client-neutral; Claude-Code-specific model/subagent invocation removed. |

## NOT bundled — deliberately excluded

These are dependencies of the workflow but were **excluded because no
redistributable licence was found** in the installed copies on the machine this
package was assembled on. Bundling them without permission would be a licence
violation, so they are declared as optional external packs instead:

| Capability | Dependency | Reason excluded |
|---|---|---|
| Product-type intelligence (Layer A) | `ui-ux-pro-max` | No LICENSE file in the installed copy; SKILL.md states no licence |
| Craft methodology / design-system authoring | `baoyu-design` | No LICENSE file in the installed copy; no licence or copyright notice anywhere in it |
| Accessibility review checklist | `accessibility` (skill) | No LICENSE file |
| Visual craft / anti-slop rules | `craft` (skill) | No LICENSE file |
| Design measurement | `design-analysis` (skill) | No LICENSE file |

**Consequence:** the core workflow is fully functional without them. Layer A
reference selection reports itself unavailable rather than guessing. See
`docs/dependencies.md` for how to install them yourself if you want the
enrichment.

If you are the author of any of the above and intend them to be redistributable,
add the licence file to your repository and this package can bundle them in a
later version.

## Optional MCP servers (installed by the user, not bundled)

| Server | Package | Licence | Configured in |
|---|---|---|---|
| Playwright MCP | `@playwright/mcp` | Apache-2.0 | the user's own agent MCP config |
| Chrome DevTools MCP | `chrome-devtools-mcp` | Apache-2.0 | the user's own agent MCP config |
| shadcn MCP | `shadcn` | MIT | the user's own agent MCP config |

This package writes **recommended** MCP entries into your agent config only with
explicit consent, and never replaces an existing file wholesale.
