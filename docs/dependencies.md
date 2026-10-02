# Dependencies

Core Node tools need zero npm runtime dependencies. A complete package includes its
metadata, instructions, negative-control fixtures and provenance manifest.

## Bundled knowledge with retained licenses

- 74 brand systems: awesome-design-md, MIT.
- 67 archetypes: awesome-design-skills, MIT.
- Seven selective UX stages: claude-design-skills, MIT. Its full orchestrator is a
  reference only; omitted stages are not silently fabricated.
- frontend-design influence: Apache-2.0.
- 192 product priors plus adapted browser audit/review: ui-ux-pro-max-skill, MIT.
  Root license verified at pinned commit 09170eec67eefd46a7ae85de61b40c194020f997.
  Original audit/review snapshot files matched upstream exactly.

See licenses/upstream/, THIRD_PARTY_NOTICES.md and dependencies.lock.json.
The manifest records normalized SHA-256 content, not speculative provenance.

## Optional complete methodology/search

`designer-setup --profile full` previews both pinned repositories;
`--apply` fetches them to personal state, retaining root licenses and notices.
Existing valid packs can be reused; DESIGNER_UIPM/DESIGNER_BAOYU select roots explicitly.

Pinned sources are in data/optional-packs.json:
- ui-ux-pro-max-skill 09170eec67eefd46a7ae85de61b40c194020f997 (MIT).
- baoyu-design 6530033592bf7fa58bc1a5a2a2ad278da45213a9 (MIT).

These are upstream installations, not the author's private collection. Full search
requires Python 3; setup reports availability and should not claim execution without
running it. knowledge.mjs reports exact loadable paths. The craft/accessibility/
design-analysis private skills remain optional and unbundled; use the portable
grammar/review/browser authority when absent.

## Browser runtime

Playwright is pinned to 1.63.0 (Apache-2.0). browser setup installs it with a generated
runtime lockfile into personal state, downloads Chromium, then launches/screenshots.
This works without a package archive lockfile or writable package directory.
A resolver is shared by setup, doctor, audit and new project flow scripts.

Do not equate a downloaded browser with a resolvable Node module. Linux system
libraries and corporate download restrictions remain explicit external prerequisites.

## Reproducibility

`npm run build-index` regenerates the deterministic reference index.
`npm run build-manifest` regenerates dependencies.lock.json.
`node scripts/build-manifest.mjs --check` verifies it without writing.
Use both after changing shipped instructions/data/logic. CI checks them and tests
packed-archive plus independent-copy lifecycle behavior.
