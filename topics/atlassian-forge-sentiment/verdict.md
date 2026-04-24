---
title: atlassian-forge-sentiment - Verdict and Applicability
tags: [verdict, recommendation, evaluation]
created: 2026-04-19
updated: 2026-04-19
status: complete
---

# atlassian-forge-sentiment - Verdict and Applicability

## Verdict

**Do not adopt `atlassian-forge-sentiment` as a current Jira app. Use it only as a reference sketch for in-issue sentiment triage, then rebuild the idea on modern Forge primitives.**

The repo's value is conceptual, not operational. It demonstrates a reasonable product instinct, but the shipped code is tiny, stale, under-documented, and visibly buggy. A modern replacement would need current Forge UI primitives, bundled assets, explicit permissions, better text handling, and validation against real ticket data before it could be trusted.

## Reusable Value

- Put triage signals directly in the issue surface instead of a separate dashboard.
- Make model output inspectable by showing which text influenced the score.
- Aggregate multiple issue fields, but keep the scoring explanation close to each field.

## Risks & Caveats

**WARNING: Runtime blockers likely exist.** The code calls `api.asApp()` without importing `api`, and the score accumulator references the wrong variable in multiple branches. (Stress Test #2, HIGH)

**WARNING: Platform posture is stale.** The repo still sits on very early Forge UI dependencies while Atlassian's current guidance and deprecation timeline have moved on. (Stress Test #4, HIGH)

**WARNING: Data handling is underspecified.** The app reads issue descriptions and comments but provides no redaction, auditing, or privacy framing. (Stress Test #7, HIGH)

- External HTTP image dependencies are fragile.
- README and packaging quality are starter-template grade.
- Legal reuse remains unclear because the repo lacks a top-level license file.

## When to Use It

- You want one small artifact showing how a Jira issue panel can compute a heuristic score from issue text.
- You are explicitly studying old Forge examples and their migration debt.

## When Not to Use It

- You need a working Forge app today.
- You need support analytics you can trust operationally.
- You need a repo with current docs, releases, or maintainers.

## Next Steps

1. Treat the repo as a product concept only, not a codebase to extend.
2. Rebuild the same idea on modern Forge UI or a service-backed panel.
3. Replace lexical sentiment with a tested classifier or rubric tied to real support outcomes.
4. Add explicit privacy, permission, and explanation design before any real deployment.

## Research Quality

Scored 8.40/10 against the R&R quality rubric (8-dimension, 8.0 = PASS).

| Dimension | Score | Weight | |-----------|------:|:------:| | Evidence Quality | 9/10 | 20% | | Actionability | 8/10 | 20% | | Accuracy | 9/10 | 15% | | Completeness | 8/10 | 15% | | Objectivity | 8/10 | 10% | | Clarity | 8/10 | 10% | | Risk Awareness | 9/10 | 5% | | Conciseness | 8/10 | 5% |


