---
title: Microsoft MarkItDown Topic — Adversarial Security Audit
tags: [security, audit, public-release]
created: 2026-04-24
verdict: FLAG
---

# Microsoft MarkItDown Topic — Adversarial Security Audit

## Verdict: FLAG

The topic content itself does not contain verified secrets, but the public-release posture has a real leak-path issue: `_pipeline/` artifacts are present and not ignored. That conflicts with the repository's own public-edition promise that pipeline audit artifacts are omitted.

## Findings

### HIGH: Pipeline artifacts are publishable by default

Evidence:

- `.gitignore` ignores session temp files, `node_modules`, and OS artifacts, but does not ignore `topics/*/_pipeline/`.
- `README.md` says the public edition omits "pipeline audit artifacts."
- `CLAUDE.md` says optional private or local pipeline artifacts should stay out of public mirrors unless deliberately sanitized.
- `topics/markitdown-codex-version/_pipeline/` currently contains drafts, state, stress-test, security-review, challenge, evidence, and citation JSON.

Impact:

Future topics can easily leak user request text, prompt fragments, intermediate reasoning, local environment notes, failed-source details, or raw fetched metadata if `_pipeline/` is committed by habit. The current MarkItDown run appears sanitized, but the control is process-dependent rather than enforced.

Recommended fix:

Ignore `topics/*/_pipeline/` for public mirrors by default, or add an explicit allowlist workflow for sanitized pipeline artifacts.

### MEDIUM: `state.json` records the original user request

Evidence:

- `topics/markitdown-codex-version/_pipeline/state.json` includes `user_request` with the original phrasing.

Impact:

This specific request is not sensitive, but the pattern is dangerous. On another topic, this field could capture private project names, internal URLs, people, or confidential intent.

Recommended fix:

For public artifacts, replace `user_request` with a sanitized topic statement or exclude `state.json` from public mirrors.

### MEDIUM: Citation claim-check is noisy and can create misleading audit confidence

Evidence:

- `npm run verify-citations -- --topic markitdown-codex-version --claim-check` returned 33 reachable URLs, but 6 `CLAIM-ABSENT`, 14 `CLAIM-UNVERIFIABLE`, and 13 fetch errors.
- The base citation verifier passes reachability only; it does not confirm semantic support.

Impact:

A green citation check can be misread as claim validation. That is especially risky for public technical recommendations where readers may assume the citations support every nearby claim.

Recommended fix:

Keep the reachability check, but do not treat it as semantic validation. Use stronger link text or add a manual support-check checklist for high-impact claims.

## Clean Results

- `trufflehog filesystem . --only-verified --no-update` found 0 verified secrets.
- Private-identifier regex scans found no private organization/project/personal matches beyond expected generic terms and MIT license text.
- `npm run topic-validate:all` passed.
- `node scripts/validate-pipeline-state.js --topic markitdown-codex-version` passed.

## Release Gate Recommendation

Do not publish the repository with `_pipeline/` artifacts unless the intent is explicitly to publish sanitized pipeline traces. For the safer public default, publish only:

- `topics/{slug}/overview.md`
- `topics/{slug}/notes.md`
- `topics/{slug}/verdict.md`
- index files, scripts, docs, and reusable `.claude` definitions

Then keep pipeline artifacts local, ignored, or exported through a separate sanitized review process.
