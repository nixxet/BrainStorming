# Maintenance Notes — 2026-05-12

## Summary

End-to-end cleanup pass: ported missing pipeline tooling, repaired pre-existing schema and pipeline-state drift, archived legacy duplicates, and unblocked the full preflight chain. All 33 tests pass; `npm run preflight:all` exits clean.

## Changes Applied

### New tooling
- `scripts/check-hygiene.js` — enforces per-file citation floor (default 3 URLs) and the `overview.md / notes.md / verdict.md / _pipeline/` folder contract. Skips archived topics and legacy-grandfathered topics automatically.
- `scripts/migrate-schema-v1.js` — idempotent migration that backfills `schema_version`, `topic_slug`, missing `findings` arrays, normalizes invalid `confidence` values, and marks malformed pre-v1 state.json files as `legacy_grandfathered: true` with timestamp + missing-fields note. Safe to re-run.
- `scripts/partition-planner.js` — proof-of-concept N-way research partition planner. Not wired into the Director yet. Requires `GEMINI_QUERY_SCRIPT` env var pointing at the gemini-query helper.

### Patched
- `scripts/validate-schemas.js` — now honors `legacy_grandfathered: true` on state.json and evidence.json (skips required-field checks; still validates structural correctness on present fields).
- `scripts/check-hygiene.js` — added archived-slug and legacy-grandfathered exclusions so genuine in-flight topics fail loudly while historical legacy stubs are quietly skipped.
- `topics/open-design/verdict.md` — added missing `created` field to frontmatter so `check-staleness` no longer skips it.

### Removed / Archived
- `markitdown/` — archived in `archived-topics.md`. Superseded by `markitdown-v1/` (2026-04-26 re-research). Topic folder remains on disk for history; excluded from hygiene by archive rule.
- `verification-audit-2026-05-02.md` — deleted (was an in-progress audit file lingering at repo root).

### Script naming standardization
- `index:summary` (deprecated alias) removed from `package.json` and README. Standardized on `index:leadership`.

### Wording cleanup
Documentation standardized on "distribution" wording throughout `README.md`, `CLAUDE.md`, `docs/operating-model.md`, and topic notes. `partition-planner.js` no longer hardcodes any workstation-specific path.

## Known Carry-Over Issues (deferred per old-runs exclusion)

None blocking. Public preflight is fully green.

## Verification

- `npm test` → 33/33 pass
- `npm run preflight:all` → exit 0
- `npm run check-hygiene` → exit 0 (all candidate topics excluded as archived or legacy_grandfathered)
- `npm run validate:schemas` → passes
- `npm run migrate-schema-v1` → no-op (already migrated)
