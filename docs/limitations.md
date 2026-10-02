# Limitations

Read this before deciding whether the package fits your situation.

## 1. Not all agents are equally capable

The workflow is portable; the *agent* is not uniform. An agent without a browser can
still produce strong design reasoning, but it cannot verify a rendered page. The
package requires such an agent to say so rather than imply validation.

## 2. Reference Layer A is not bundled

Product-type intelligence (192 product types) requires the optional external
`ui-ux-pro-max` pack, excluded for licence reasons. Without it, Layer B (141
references) still works but is marketing/design-site shaped — thin for clinical, CRM
and internal-ops domains. The tool reports this gap instead of hiding it.

## 3. Layer B is not a product-UI reference library

The 74 bundled design systems are real **brand and product sites**. They answer "how
does a mature team relate colour, type, density and surfaces". They do not answer "how
does a dense operations console lay out an order ticket". For dense product UI,
derive from product context — the tool tells the agent to do exactly this.

## 4. The drift checker is regex, deliberately

It detects values that are *off-system*. It cannot judge whether a value is *used
well*. A colour used 40 times for 40 different meanings passes the checker and still
fails review. Judgement stays with the reviewer (`references/design-review.md`).

It is also text-based: it will not follow Tailwind classes, CSS-in-JS, or styles
generated at runtime. Those need the review, not the checker.

## 5. The audit is a heuristic, not a verdict

`design-audit.mjs` is a fast local pass. It is **not** WCAG certification, and it is
not a design-quality judgement. Its contrast check is approximate (nearest opaque
background). Treat findings as leads.

## 6. No Storybook integration

Component discovery is `grep` over the project plus an optional shadcn MCP. If a
project has a Storybook, discovery is better done there — the package does not consume
it yet.

## 7. No human art direction

The agent can look at its own work, but you cannot yet drag things around. Visual
refinement is still a conversation with the agent.

## 8. Benchmark scores are not self-awarded

`benchmarks/run-benchmark.mjs` scaffolds a run and a 12-dimension scorecard. The score
is a judgement made against evidence, by a reviewer. The tooling refuses to invent one.

## 9. Eval retrieval is keyword-based

`record.mjs retrieve` scores by term overlap and tags. It will surface loosely relevant
records. Treat it as a starting set to read, not an authoritative precedent.

## 10. No CI integration shipped

The scripts exit non-zero on findings, so `design-drift` works in CI today. But no
GitHub Actions workflow is included, because CI config belongs to the consuming
project.

## 11. Cross-platform claims

Developed and tested on Windows. The code is platform-aware (no hardcoded separators,
platform-specific state directories, `shell` flags for npm on Windows) but
**macOS and Linux are unverified** — no CI matrix runs them yet. See the support
matrix in `agent-support.md`.

## 12. Adapted upstream material

`scripts/design-audit.mjs` was copied verbatim from a snapshot whose licence file was
absent (only a `package.json` field). Treat its provenance as *declared, not verified*.
See `dependencies.md`.
