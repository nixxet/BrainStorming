# BrainStorming Operating Model

## Roles

- Topic operator: starts or resumes research workflows and runs local preflight checks.
- Technical reviewer: confirms the recommendation is actionable and evidence-backed.
- Security reviewer: reviews security-sensitive topics and public export hygiene.
- Publisher: approves public or leadership-facing output.

## Publication Gates

A topic is leadership-ready only when:

- `overview.md`, `notes.md`, and `verdict.md` exist.
- Required frontmatter is present.
- `npm run topic-validate:all` passes.
- `npm run validate-pipeline-state` passes.
- Staleness is checked with `npm run check-staleness`.
- Citation health is checked or explicitly deferred because of network limits.
- Security review is completed or explicitly not applicable.
- The verdict includes a clear recommendation, confidence, risks, and next steps.

## Public Release Policy

`_pipeline/` artifacts are private internal audit data by default. Use `npm run export:public` to produce public-safe output under `dist/public/`.

Do not publish raw repository history when private topics, user requests, drafts, or internal evidence files may have existed in the repo.

## Maintenance Cadence

- Run `npm run preflight:all` before committing.
- Run `npm run preflight:network` before leadership delivery when network access is available.
- Run `npm run claims:check` before leadership delivery to identify claims that need direct source review.
- Run `npm run index:leadership`, `npm run dashboard`, and `npm run trend-report` before stakeholder review packets.
- Review stale topics monthly.
- Re-run citation checks before external sharing.
- Archive superseded topics rather than deleting them.
