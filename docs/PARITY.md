# Parity closure — 1.2.2

The 1.2.2 release also normalizes reference source text before indexing, so CRLF/LF
checkouts produce the same descriptions/facets. Distribution evidence paths are
resolved absolutely, allowing the same browser test to run from CI with --out set
to a relative directory. Doctor drains piped JSON before exiting, preventing
macOS output truncation. Failed CI controls publish diagnostic annotations.

The 1.2.1 patch normalizes extensionless LICENSE files and CSV text in the integrity
manifest. A fresh Git checkout exposed a CRLF/LF mismatch in 1.2.0; a dedicated
regression test covers both line-ending forms without relaxing verification.

## Implemented repairs

- Managed updates refuse edited/foreign copies; staging, validation, atomic receipt
  commit and ordinary-failure rollback protect existing destinations.
- Destination-keyed receipts preserve user scope and multiple project registrations.
- Installed copies include required package metadata, tests, security notes and
  a reproducible integrity manifest. They can run their own tools.
- Browser setup works from an npm archive/copy without a package lockfile or dev
  dependencies: pinned Playwright/Chromium live in personal state.
- Active grammar/review instructions use the package root, never the legacy tool root.
- A lazy capability router loads bundled aesthetic/UX intelligence; 192 MIT-verified
  product priors are now bundled alongside the original 141 brand/archetype references.
- The audit/review redistribution gate is resolved: original source matches a pinned
  upstream snapshot whose actual MIT text and source hashes are retained.
- Full optional methodology/search can be installed from pinned canonical repositories
  without a private skill collection. Both fetch paths were exercised; Python search
  returned a real SaaS result. Empty overrides cannot accidentally select Designer
  itself as a baoyu pack.
- Setup dry-run does not mutate files. Overrides/aliases/CLI documentation are aligned.
- Preferences import explicitly, non-destructively and idempotently; repeated records
  cannot overwrite previous ones; examples are not learned as personal preferences.
- Doctor separates valid entry files from unexercised client discovery/MCP. Overall
  readiness reflects the selected profile instead of passing partial full readiness.

## Executed evidence

- Original core suite: **24/24 passing**.
- Lifecycle/portability regressions: **30/30 passing**.
- Real npm archive (369 entries), isolated consumer, independent skill copy:
  both complete core suites pass without the author's home collection.
- Browser setup executed from that installed copy. Pinned library installed in
  isolated user state, Chromium launched and a screenshot was captured.
- New local booking smoke fixture: successful booking/state update, invalid input,
  confirmation-before-commit, keep-editing, duplicate-time recovery, mobile overflow
  and clean console checks pass.
- Fixture audit: **0 high / 0 medium / 0 low**. A deliberately removed focus indicator
  is rejected; hidden/inert/disabled controls no longer produce false focus failures.
- Original Meridian: drift clean; browser audit retains **0 high / 1 medium / 0 low /
  0 console errors**; existing **29/29** outcome checks pass. Its mobile tap-target
  limitation remains a documented benchmark waiver, not general touch approval.
- Provenance manifest and deterministic index checks pass locally.

Reproduce: `npm test`; `node tests/distribution-tests.mjs --out <evidenceDir>`;
`node scripts/build-manifest.mjs --check`.
Source changes require rebuilding the index/manifest before packing.

## Boundaries, not hidden success claims

This is closure of the reproducible **code/distribution/lifecycle** gaps. The smoke
fixture is a test harness, not a independently generated Tier 4 design benchmark.
No blind/model-generation comparison, equal-taste guarantee, or universal client
certification is claimed. Native loading must be exercised in each actual client;
MCP configuration/connectivity remains owner-controlled and separately verified.

Earlier c61e00c CI was observed successful on Windows/macOS/Linux. The updated matrix
also runs archive/copy/browser/flow regressions, but its remote results must be checked
after this version is pushed. npm publication is a separate authenticated operation.

The original local system, legacy skill, and personal records remain intact.
This repair does not silently upgrade real client copies or migrate personal history;
use the safe installer/import preview, then explicit --apply when ready.
