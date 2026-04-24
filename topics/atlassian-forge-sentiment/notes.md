---
title: atlassian-forge-sentiment - Research Notes
tags: [research, findings, evaluation]
created: 2026-04-19
updated: 2026-04-19
status: complete
---

# atlassian-forge-sentiment - Research Notes

## Strengths

- **[HIGH]** The core product idea is easy to understand and still reusable: summarize ticket tone directly in the Jira issue view so triage happens where support or engineering already works. - [manifest.yml](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/manifest.yml), [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

- **[MEDIUM]** The implementation stays self-contained. It uses the lightweight `sentiment` npm package and Jira REST reads instead of adding a separate model service. - [package.json](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/package.json), [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

- **[MEDIUM]** The UI tries to expose evidence, not just a single score. Positive and negative terms are highlighted and the breakdown table separates summary, description, and comments. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

## Product Reality Checks

- **[HIGH]** The README is still the stock Forge Hello World text and does not document sentiment-specific setup, permissions, screenshots, validation, or limitations. - [README.md](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/README.md)

- **[HIGH]** The repo is extremely small and effectively unmaintained: two commits total, last pushed on `2020-07-08`, no releases, no tags, no license file detected by GitHub. - [GitHub API repo metadata](https://api.github.com/repos/willpowell8/AtlassianForgeSentiment), [repo page](https://github.com/willpowell8/AtlassianForgeSentiment)

- **[HIGH]** This is not a modern Forge example. The app depends on `@forge/ui ^0.3.1`, while current Atlassian UI Kit guidance is centered on `@forge/react` 10+ and Atlassian announced UI Kit 1 and sandbox runtime deprecations effective `2025-02-28`. - [package.json](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/package.json), [UI Kit docs](https://developer.atlassian.com/platform/forge/ui-kit/), [deprecation notice](https://community.developer.atlassian.com/t/reminder-upcoming-sandbox-runtime-and-ui-kit-1-deprecations/89214)

## Code-Level Findings

- **[HIGH]** The implementation calls `api.asApp().requestJira(...)` but never imports `api`, which is an immediate runtime or build blocker unless hidden tooling injects it. No such injection is documented here. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

- **[HIGH]** Score aggregation is buggy. In the summary and comment paths, the code adds `analysis.score` even though those branches define `titleAnalysis`, not `analysis`; that points to a likely reference error or wrong total. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

- **[MEDIUM]** The issue description parsing is brittle because it manually walks Atlassian Document Format structures and assumes shallow `content` nesting. Jira Cloud v3 uses ADF broadly, and real issue bodies can be much more varied than the implementation handles. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx), [Jira REST API v3 intro](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)

- **[MEDIUM]** The app pulls sentiment images from `http://willpowell.co.uk/...` rather than bundling assets or using HTTPS. That is a weak dependency for both reliability and trust. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

## Operational and Security Risks

- **[HIGH]** Ticket descriptions and comments are sensitive operational text in many Jira deployments. This app reads them all and then displays a simplified emotional score without any audit trail, redaction behavior, or explanation of data handling. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

- **[MEDIUM]** The lexical scoring model is shallow. It does not account for sarcasm, domain jargon, customer severity language, or multilingual content, so it is likely to misread support queues if adopted literally. - [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

- **[MEDIUM]** Because there are no tests or demo datasets, there is no evidence that the scoring remains stable across modern Jira Cloud payloads or current Forge runtime behavior. - [repo tree](https://github.com/willpowell8/AtlassianForgeSentiment), [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

## Reusable Patterns

- **[HIGH]** Compute triage signals inside the issue UI where analysts already work.
- **[MEDIUM]** Show contributing evidence, not only a black-box score.
- **[MEDIUM]** Aggregate across summary, description, and comments instead of using only one field.

## Critical Gaps & Unknowns

- No install instructions beyond stock Forge starter text.
- No manifest explanation of scopes or permissions.
- No tests, no screenshots, no releases, no changelog.
- No proof the current code still runs on today's Forge stack.

## Confidence Summary

| Confidence Level | Count | Examples | |------------------|-------|----------| | HIGH | 7 | repo maturity, missing import, wrong variable usage, outdated dependency posture | | MEDIUM | 6 | reusable UI idea, parsing brittleness, sentiment-model limits, external image risk | | LOW | 0 | - | | UNVERIFIED | 0 | - |

**Overall:** good concept sketch, weak and outdated implementation.
