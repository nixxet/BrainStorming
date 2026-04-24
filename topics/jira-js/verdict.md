---
title: jira.js — Verdict
tags: [verdict, recommendation]
created: 2026-04-19
---

# jira.js — Verdict

## Recommendation

**Conditional recommend.** For TypeScript/Node.js projects that need programmatic Jira Cloud access, adopt jira.js as the client layer — with the explicit understanding that pagination, rate-limit backoff, and OAuth token lifecycle are caller responsibilities, and that PAT auth should not be relied on without live verification.

Rationale cites verified findings:

- **No viable maintained alternative exists.** `jira-client` (3 years stale) and `jira-connector` (6 years stale) are abandoned; Atlassian publishes no official JavaScript REST SDK. **[HIGH]** confidence — F6, npmtrends + Atlassian developer docs + Socket.dev
- **Four client classes cover the Jira Cloud API surface** (Platform v2/v3, Software/Agile, Service Management) per the maintainer's README. **[MEDIUM]** confidence — F1; independent API-parity audit not performed
- **TypeScript definitions are bundled,** mechanically verifiable via the `"types"` field in package.json. **[MEDIUM]** confidence — F2; type accuracy vs. live API responses not independently verified
- **Dual ESM/CJS output with subpath exports** supports modern bundler setups and tree-shaking. **[MEDIUM]** confidence — F3; ESM transition had regressions fixed through v5.3.1
- **Telemetry was removed in v5.0.0** per the CHANGELOG — no outbound data transmission claimed in current v5.x. **[MEDIUM]** confidence — F10; v5.x source-code audit not performed

The conditional hinges on the caveats below. If the project hits any invalidation condition, re-evaluate before adoption.

## What It Is Not

- **Not an SDK or integration framework.** jira.js does not implement OAuth 2.0 flows, token refresh, pagination loops, rate-limit backoff, or webhook handling. It is a typed HTTP wrapper.
- **Not a Forge replacement.** Atlassian's Forge platform (mandatory for new Marketplace submissions from September 2025) is a separate app-hosting runtime. jira.js is for teams making direct REST calls to Jira Cloud.
- **Not the same as `jira-client`.** Different package, different (abandoned) maintainer, different API shape. Do not conflate their download counts or adoption signals.
- **Not a browser-first library.** It runs in the browser via a bundler, but issue #392 (Webpack Node imports) is open and Angular integrations need configuration work.

## What Is Reusable

The architectural pattern — class-per-product-area with subpath exports, bundled `.d.ts` files, minimal runtime dependency footprint — is applicable to any project that wraps a large REST API surface for a vendor without an official JS SDK. The library's *gaps* are also instructive: any typed REST wrapper we build or adopt should be audited for pagination handling, rate-limit header propagation, and OAuth lifecycle support before adoption, because these are the common absences.

## Future Project Relevance

Any future internal tool or automation that needs typed Jira Cloud access should default to jira.js given the absence of alternatives. The pattern (typed REST client with externalized pagination/auth-lifecycle) is also a reference point for evaluating or building similar clients for other vendors.

## Recommendation Invalidation Conditions

1. **PAT auth is verified broken against a live Jira Cloud instance AND the project requires PAT auth** (e.g., Jira Data Center tokens or service accounts using PATs). → jira.js cannot be used without a patch or fork. Fall back to a direct `axios`/`fetch` wrapper. (Note: issue #351 appears closed as of 2026-04-19; verify before assuming broken or fixed.)
3. **Type quality investigation (gap G1) reveals types are hand-maintained and significantly stale.** → The primary DX advantage evaporates. Recommendation weakens to "use only if you need the auth abstraction."
4. **Atlassian releases an official JavaScript REST SDK** (no current signal). → The competitive-position finding (F6) becomes obsolete; re-evaluate.
5. **Maintainer activity drops to zero for >6 months** (single-maintainer bus factor materializes). → Trigger a fork/pinning contingency or migration plan.

## Vertical-Specific Constraints

- **Node.js ≥ 20 hard requirement.** Node 18 (EOL October 2025) and earlier are blocked. Confirm runtime before adoption. **[MEDIUM]** confidence — F8
- **PAT auth status uncertain — see C1 above.** Do not rely on PAT auth without verifying against a live Jira Cloud instance.
- **Forge Marketplace apps should not use this library.** Forge has its own bindings and runtime; jira.js is for direct REST callers only.

## Risks & Caveats

The following caveats are non-optional — each must be acknowledged before adoption:

1. **PAT auth status uncertain — workaround still recommended. [C1]** The `personalAccessToken` mode historically produced a 403 "Failed to parse Connect Session Auth Token" error on Jira Cloud (issue #351). Issue #351 **appears closed as of April 2026** (spot-checked), but the exact resolution — fix vs. closed-wontfix — was not retrievable from the issue page alone and is not reflected in reviewed CHANGELOG entries for v5.1.x–v5.3.x. **Until PAT auth is verified against a live Jira Cloud instance, continue using basic auth (`email` + `apiToken`) as the safe default.** Do not rely on issue closure status alone as confirmation of a working fix.
2. **No built-in pagination helpers. [C2]** Callers must implement `startAt/maxResults/total` loops for v2 endpoints and `nextPageToken` loops for v3 endpoints — these contracts are not interchangeable, which is a real migration trap when moving between API versions.
3. **Single-maintainer project. [C3]** All commits trace to one person. Bus-factor risk is real for production integrations with long expected lifetimes. Plan a fork/pinning contingency.
4. **⚠️ OAuth 2.0 token refresh support is UNVERIFIED. [C4]** Do not assume the library handles token expiry. Callers implementing OAuth 2.0 must manage token lifecycle externally until source inspection confirms otherwise.
5. **Type accuracy vs. actual Jira API responses is not independently verified. [C5]** Bundled types are confirmed present; their completeness and correctness against live Atlassian API responses are unknown. Do not treat "typed" as "correct" without spot-checking against real responses. Dependency audit anchor: the current type surface is shipped alongside `zod ^4.3.6`.

Additional lower-severity caveats:

- **⚠️ Retry-After header propagation in `HttpException` is UNVERIFIED.** Do not rely on it for rate-limit backoff until source inspection confirms it.
- **Zod v4 peer conflict risk (LOW confidence).** Limited evidence suggests projects using Zod v3 elsewhere will need to resolve the conflict (`zod ^4.3.6` is declared in package.json). Confirm against the project's existing Zod usage before adopting.
- **ESM transition rough edges.** v5.1.1 and v5.3.1 shipped fixes for ESM regressions; expect bundler configuration work in non-trivial setups.

## Next Steps

1. **Resolve Gap G2 first.** Read the full issue #351 page (including comments) and cross-check against v5.1.x–v5.3.x CHANGELOG entries; the issue appears closed but the resolution reason is not confirmed. Pair with a live Jira Cloud instance test of PAT auth. This single check changes the PAT-auth story.
2. **Resolve Gap G3.** Inspect the v5.x `Config` type definition for `onTokenRefresh` or equivalent. Needed before committing to any OAuth 2.0 automation.
3. **Resolve Gap G5.** Inspect `HttpException` and axios interceptor configuration for `Retry-After` propagation. Needed before committing to any high-volume automation.
5. **Build a thin project-local wrapper** around jira.js that adds: pagination loop helpers (v2 and v3 variants), `Retry-After`-aware backoff, and OAuth token refresh plumbing. Minimum-viable scope: one `paginateV2<T>(fn, params)` helper, one `paginateV3<T>(fn, params)` helper, a `withBackoff(fn)` wrapper that reads `Retry-After` from `HttpException` (falling back to exponential backoff if absent), and a `TokenProvider` interface the Version3Client is constructed with. Treat jira.js as the typed surface; own the operational layer.

## Runner-Up / Alternatives

- **Direct `axios` or `fetch` wrapper.** Viable if the project only needs a narrow API slice and can hand-roll types for the endpoints it touches. Sacrifices the typed-surface breadth of jira.js but avoids single-maintainer dependency risk and Zod v4 conflict.
- **`jira-client` (npm).** 216k weekly downloads reflect installed base / legacy lock-in, not active adoption preference. Last updated 3 years ago; requires separate `@types` package. **Not recommended for new work.** **[HIGH]** confidence — F6
- **`jira-connector` (npm).** 6 years stale. **Not recommended.** **[HIGH]** confidence — F6
- **`@atlassian/jira` (npm).** A stub package under the Atlassian npm account — version 0.1.0, last published 7 years ago, no meaningful REST API coverage. It is **not** an official Atlassian JavaScript REST SDK despite the namespace suggesting otherwise. **Not relevant.** [confirmed by spot-check 2026-04-19]
- **Atlassian Forge platform.** Different runtime, different use case. Appropriate only for Marketplace apps — not a substitute for direct REST API callers.

## Research Quality

Scored 8.35/10 against the R&R quality rubric (8-dimension, 8.0 = PASS).

| Dimension | Score | Weight | |-----------|------:|:------:| | Evidence Quality | 8.0 | 20% | | Actionability | 8.8 | 20% | | Accuracy | 8.5 | 15% | | Completeness | 8.3 | 15% | | Objectivity | 8.5 | 10% | | Clarity | 8.2 | 10% | | Risk Awareness | 8.5 | 5% | | Conciseness | 7.5 | 5% |



**Mode note:** Quick pipeline — Investigator, gap-fill, security review, stress test, and adversarial challenge phases were skipped. Run standard /research for full validation.
