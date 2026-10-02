# Provenance

Designer was extracted by copying the working local implementation, not by replacing
it with an imitation. The original local setup is retained independently.

Director, grammar, design template, drift, reference selection and eval orchestration
retain their original behavior except the documented portability/safety corrections.
Original audit/review source was traced to the upstream ui-ux-pro-max stack.

## Verified audit/review and product-data source

Repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Commit: 09170eec67eefd46a7ae85de61b40c194020f997

Before portability edits, the local original stack audit/review files matched the
upstream files exactly. Upstream MIT text, source commit and original file SHA-256
are retained in licenses/upstream/uipm-stack/. Product rows also match upstream
after newline normalization. Audit now uses the shared runtime; review paths/tool
instructions are client-neutral. License uncertainty from the incomplete local
snapshot has therefore been resolved with actual upstream evidence.

Other bundled datasets retain their original MIT/Apache texts in licenses/upstream.
Exact shipped content is captured in dependencies.lock.json. Original source commit
IDs for older brand/archetype snapshots were not established; do not invent them.
No trademark/brand asset rights are implied by a reference document.

## Optional canonical repositories

data/optional-packs.json pins complete ui-ux-pro-max and baoyu-design installations.
Setup fetches canonical repositories only with --apply, retaining licenses/notices.
These are not distributed copies of private skill modifications. Existing local
packs remain subject to their own provenance.

## Evidence boundaries

Meridian is an existing separately built benchmark, not a bundled production app.
Audit/flow parity on it does not prove equal design judgment for fresh outputs.
Tests, installed-copy runs, archive bootstrap, actual browser/flow checks and
client-discovery checks must be reported separately. See PARITY.md.
