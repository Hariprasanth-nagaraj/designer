# Contributing

## Ground rules

1. **No unlicensed material.** Before adding anything under `data/`, verify the
   upstream licence text yourself and store it in `licenses/upstream/`. If no licence
   can be found, do not bundle it — declare it as an optional external pack instead.
   This is why `ui-ux-pro-max` and `baoyu-design` are *not* in this package.
2. **Do not edit vendored files.** Bundled reference material stays byte-identical to
   upstream. If you must adapt something, put your version in `references/`, say so in
   `THIRD_PARTY_NOTICES.md`, and keep the original under `data/`.
3. **A checker that cannot fail is worse than no checker.** Any new check needs a
   *negative control* — a fixture that must be rejected. See
   `tests/fixtures/drift-bad/`. A PR that adds a check without one will be asked for
   one.
4. **Never hardcode a path.** Resolve from `import.meta.url` / `lib/paths.mjs`. Tests
   assert there are no absolute user paths in shipped logic.
5. **Report what you could not verify.** If you could not run a browser check, say so
   in the PR. `doctor.mjs` must never print a green check for an unverified capability.

## Development

```bash
node tests/run-tests.mjs        # or: npm test
node scripts/setup.mjs          # dry run
node scripts/doctor.mjs         # full capability probe
node scripts/build-reference-index.mjs
```

The index build must be deterministic — building twice from unchanged data must
produce a byte-identical file. A CI job enforces this.

## Adding a capability from a new source

1. Record: source URL, licence text, exact version/commit, files used, optionality.
2. Add the licence to `licenses/upstream/<name>/`.
3. Add a row to `THIRD_PARTY_NOTICES.md` **and** `docs/dependencies.md`.
4. If it is optional, make every consumer degrade honestly rather than fail or fake a
   result.
5. Extend `dependencies.lock.json`.
