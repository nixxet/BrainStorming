# BrainStorming Operating Model

## Roles

- Topic operator: starts or resumes research workflows and runs local preflight checks.
- Technical reviewer: confirms the recommendation is actionable and evidence-backed.
- Security reviewer: reviews security-sensitive topics and distribution export hygiene.
- Publisher: approves stakeholder-facing output.

## Publication Gates

A topic is ready for delivery only when:

- `overview.md`, `notes.md`, and `verdict.md` exist.
- Required frontmatter is present.
- `npm run topic-validate:all` passes.
- `npm run validate-pipeline-state` passes.
- Staleness is checked with `npm run check-staleness`.
- Citation health is checked or explicitly deferred because of network limits.
- Security review is completed or explicitly not applicable.
- The verdict includes a clear recommendation, confidence, risks, and next steps.

## Distribution Policy

`_pipeline/` artifacts are internal audit data. Use `npm run export:public` to produce distribution-safe output under `dist/public/`.

Do not publish raw repository history when in-progress topics, user requests, drafts, or internal evidence files may have existed in the repo.

## Maintenance Cadence

- Run `npm run preflight:all` before committing.
- Run `npm run preflight:network` before delivery when network access is available. **Note: requires live internet access.**
- Run `npm run claims:check:strict` before delivery to enforce direct, registry, nearby, or internal-analysis support for claim-like lines.
- Run `npm run index:summary`, `npm run dashboard`, and `npm run trend-report` before stakeholder review packets.
- Review stale topics monthly.
- Re-run citation checks before external sharing.
- Archive superseded topics rather than deleting them.
