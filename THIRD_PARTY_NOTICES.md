# Third-party notices

Authored code is MIT. Each bundled upstream retains its own license; full texts are in licenses/upstream/.

| Material | Source | License | Changes |
|---|---|---|---|
| 74 brand systems, data/brand-systems | https://github.com/VoltAgent/awesome-design-md | MIT | Selected reference documents; no brand asset rights implied. |
| 67 archetypes, data/style-archetypes | https://github.com/bergside/awesome-design-skills | MIT | Preview images excluded. |
| 7 selected UX reference stages, data/ux-pipeline-skills | https://github.com/richhemsley3/claude-design-skills | MIT | Selected subset, not its full orchestration dependency tree. |
| data/frontend-design.md | https://github.com/anthropics/skills/tree/main/skills/frontend-design | Apache-2.0 | Aesthetic influence, loaded selectively. Terms: licenses/upstream/frontend-design/LICENSE.txt. |
| scripts/design-audit.mjs, references/design-review.md, 192 product types in data/product-intelligence | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | MIT © 2024 Next Level Builder | Pinned commit 09170eec67eefd46a7ae85de61b40c194020f997. Audit runtime resolver adapted; review tool/model/path instructions adapted. |

## Verified stack provenance

licenses/upstream/uipm-stack/LICENSE retains the actual upstream MIT text.
SOURCE.json records the pinned commit and SHA-256 of the original audit/review files.
Those files were compared with the original local snapshots and matched exactly
before our portability adaptations. Product rows likewise match after LF normalization.
This resolves the earlier snapshot-only license uncertainty; a package.json license
field is no longer the sole evidence.

## Apache-2.0 attribution

Licensed under the Apache License, Version 2.0. You may obtain a copy at
https://www.apache.org/licenses/LICENSE-2.0. Distributed on an AS IS basis,
without warranties or conditions of any kind. Original frontend-design attribution
and license text are retained; this notice preserves attribution under §4(d).

## Optional enrichment, not bundled

The complete ui-ux-pro-max and baoyu-design repositories are optional, pinned
external installations. Their canonical repositories contain MIT licenses;
setup --profile full --apply fetches those repositories into user-owned state and
retains their notices. Reusing an existing private/local copy does not imply its
custom additions have the upstream license.

Other private skills (craft, accessibility, design-analysis) are not redistributed:
their local copies were not independently license-cleared. The portable Director,
grammar, review, licensed intelligence and browser checks remain available without them.

## Optional processes

Playwright (Apache-2.0) is installed only by explicit browser setup or provided
through a matching module override. Playwright MCP, Chrome DevTools MCP and shadcn
MCP are client-owned optional processes. Designer never writes or replaces an
agent/MCP configuration.
