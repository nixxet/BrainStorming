# BrainStorming Recovery Playbook

Use this when a topic or pipeline run gets into a bad state. Prefer read-only diagnosis first, then apply the narrowest repair.

## State Drift

Symptoms:

- `npm run validate-pipeline-state` reports mismatched scores, phase statuses, or artifact counts.
- `npm run bench-report` classifies a published topic as incomplete.

Diagnosis:

```bash
npm run validate-pipeline-state -- --json
npm run validate-pipeline-state -- --repair
```

Repair:

```bash
npm run validate-pipeline-state:repair
npm run validate-pipeline-state
```

Do not edit published topic content unless the validator reveals a real content issue.

## Failed Citations

Symptoms:

- `npm run verify-citations:all` exits non-zero.
- Citation report shows `DEAD`, `DNS_ERROR`, `TIMEOUT`, or blocked network targets.

Diagnosis:

```bash
npm run verify-citations -- --topic <slug>
```

Repair:

- Replace true dead links with stable primary sources.
- Keep verifier-hostile but valid sources only when they are important and document the limitation.
- Never bypass private-network blocking for public citation checks.

## Stale Topic

Symptoms:

- `npm run check-staleness` lists a topic as overdue or approaching threshold.

Repair:

- Re-run the appropriate workflow.
- Update the topic only when present-day facts materially change the recommendation.
- Re-run `npm run preflight:all`.

## Partial Pipeline Run

Symptoms:

- `state.json` has `in_progress` phases.
- Expected draft or final files are missing.

Repair:

- Run `npm run pipeline-preflight -- <slug> --mode <workflow>`.
- Resume from the last completed phase rather than restarting completed research.

## Broken Index

Symptoms:

- Topic exists but is absent from `index.md`.
- Index table formatting is corrupted.

Repair:

```bash
npm run regenerate-index-dry
npm run regenerate-index
```

Use the dry run first because regeneration may replace hand-crafted summaries.

## Failed Public Export

Symptoms:

- `npm run export:public` exits non-zero.
- Export reports private artifacts or sensitive file patterns.

Repair:

- Remove the private file from the export source path.
- Update `.gitignore` if the file should never be tracked.
- Re-run `npm run export:public`.

## Secret Detected

Symptoms:

- Gitleaks or TruffleHog reports a secret.

Repair:

- Rotate the secret before doing anything else.
- Remove it from the working tree.
- If committed, clean history in a fresh remediation branch and coordinate with repository owners.
