# Security and lifecycle guarantees

Review any third-party instruction or executable before running it.

| Tool | Reads / writes |
|---|---|
| setup | Dry-run reads only. --apply creates personal state; installs pinned Playwright/Chromium there; full profile optionally fetches pinned upstream git repositories. May build a missing package reference index, never rebuilds an existing one implicitly. |
| doctor | Source inspection, sandboxed core probes; browser profile launches Chromium and captures an in-memory screenshot. It never claims client/MCP discovery from directories. |
| install-agent | Dry-run reads only. --apply stages a complete copy/link, refuses foreign/edited destinations, swaps with rollback, and writes destination-keyed receipts. No agent config edits. |
| uninstall-agent | Only receipt-owned unchanged copies/expected links; edited destinations and their receipts retained. Personal evals require explicit --purge-state; runtime and other receipts are not purged. |
| record | Approve/reject writes external personal state without collisions. import --from previews; --apply copies records with source hashes, never deletes legacy records. |
| drift | Read-only, except explicit --init creating project config. |
| audit | Opens a supplied HTTP URL, exercises focus/scroll, writes requested screenshots/report; not a security scanner or certification. |
| reference selector / knowledge | Read-only. Explicit build-index/build-manifest commands write generated package files. |

Network use is explicit: browser setup downloads npm packages/browser binaries;
optional pack setup fetches pinned git repositories; an audit loads the URL you supply.
No sudo, privileged system packages, global npm installs, model credentials, token
storage, or agent/MCP configuration replacement.

Browser scripts use one pinned resolver: explicit DESIGNER_PLAYWRIGHT, managed
state runtime, then matching package-local dev runtime. A bad explicit override is
not silently bypassed. Local state includes installation receipts, optional packs,
runtime lockfiles and evals. Keep it private and backed up.

Install transactions retain the prior destination until the replacement validates.
Ordinary failures roll back. An abrupt process/OS termination can leave a sibling
.designer-stage-* recovery directory; inspect its backup before manually removing
it. Do not run concurrent installs for the same destination.

Bundled data is reference material, not executable library code. It may instruct an
agent to run tools or alter project files: treat it as trusted input only after review.
Optional full repositories are upstream executable/instruction content under their own
terms; their installation is not independent security certification.

Report vulnerabilities privately through the GitHub repository security advisory
feature; never include credentials or recovery codes.
