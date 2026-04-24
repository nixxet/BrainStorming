---
title: jira.js — Research Notes
tags: [research, findings]
created: 2026-04-19
---

# jira.js — Research Notes

## Key Findings

### Topic-native findings

- **[MEDIUM]** jira.js exports four client classes — `Version2Client`, `Version3Client`, `AgileClient`, `ServiceDeskClient` — covering Jira Cloud Platform v2/v3, Jira Software, and Jira Service Management. According to the maintainer's README, coverage is "near-complete"; no independent audit against Atlassian's OpenAPI spec was performed. — [README](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/README.md), [Official docs](https://mrrefactoring.github.io/jira.js/)
- **[MEDIUM]** TypeScript definitions are bundled with the package at `./dist/esm/types/index.d.ts`; the `"types"` field in package.json makes this mechanically verifiable. No `@types/jira.js` package is required. Type accuracy vs. actual Jira API responses was not independently verified (see caveat C5). — [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json)
- **[MEDIUM]** v5.0.0 added ESM; the package now ships both `./dist/cjs/index.cjs` and `./dist/esm/index.mjs`. Subpath exports (`jira.js/version2`, `/version3`, `/agile`, `/serviceDesk`) enable tree-shaking. The ESM transition had multiple regressions fixed through v5.1.1 and v5.3.1 — expect bundler-configuration friction. — [CHANGELOG](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/CHANGELOG.md)
- **[MEDIUM]** **F4b — PAT auth status.** The `personalAccessToken` auth mode historically triggered a "Failed to parse Connect Session Auth Token" 403 error on Jira Cloud (issue #351, originally open January 2025 against the v5.0.0 milestone). Issue #351 **appears closed as of April 2026** (confirmed by spot-check of the live issue page). The exact resolution — whether PAT auth was fixed or the issue was closed for another reason (wontfix, duplicate, invalid) — was not confirmed from the issue page alone and is not reflected in the reviewed CHANGELOG entries for v5.1.x–v5.3.x. Until PAT auth is verified against a live Jira Cloud instance, continue using basic auth (`email` + `apiToken`) as the safe default. **Do not rely on issue closure status alone as confirmation of a working fix.** — [GitHub issue #351](https://github.com/MrRefactoring/jira.js/issues/351)
- **⚠️ [UNVERIFIED]** OAuth 2.0 token refresh and 3LO callback support is not documented in reviewed sources. No evidence confirms whether jira.js supports refresh callbacks or requires callers to re-instantiate clients with new tokens. Treat as absent until source inspection proves otherwise.
- **[MEDIUM]** All commits trace to a single primary maintainer (Vladislav Tupikin / MrRefactoring). v5.x produced 6+ releases over the ESM stabilization cycle; v5.3.1 was published January 2025 (~15 months prior to April 2026). 476 stars, 61 forks, 21 open issues. — [GitHub repository](https://github.com/mrrefactoring/jira.js/), [CHANGELOG](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/CHANGELOG.md), [npmtrends](https://npmtrends.com/jira.js-vs-jira-client)
- **[MEDIUM]** Node.js ≥ 20 is a hard requirement (explicit `"engines": {"node": ">=20"}`). Browser use is possible via a bundler, but Webpack issue #392 is open and prior Angular issues (#153) confirm non-Node environments need additional configuration. — [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json), [README](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/README.md), [GitHub issues](https://github.com/MrRefactoring/jira.js/issues)
- **[MEDIUM]** Runtime dependency tree is three packages: `axios ^1.13.5`, `mime-types ^2.1.35`, `zod ^4.3.6`. No Atlassian-owned runtime dependencies. — [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json)
- **[MEDIUM]** v5.0.0 CHANGELOG explicitly states telemetry was removed; v4.x had included optional telemetry sending anonymized auth-type, response status, and request timings. No source-code audit of v5.x was performed, so strict audit environments should verify directly. — [CHANGELOG](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/CHANGELOG.md), [Deno mirror v2.3.0 README](https://deno.land/x/jira@v2.3.0/README.md)

### Generalizable patterns

- **[MEDIUM]** Pattern: split a large REST API surface into class-per-product-area and expose subpath exports per class — reduces bundle size for callers who only use one slice of the API. Applicable to any multi-product REST vendor.
- **[MEDIUM]** Pattern: bundle `.d.ts` types with the library rather than relying on DefinitelyTyped. Mechanically verifiable via the package.json `"types"` field. Applicable to any TypeScript-first client library.
- **[MEDIUM]** Pattern: lean runtime dependency footprint (axios + validation + mime) as a deliberate choice for a client library. The absence of Atlassian-owned runtime deps also reduces lock-in.

### Cross-vertical risks

- **[MEDIUM]** Absent pagination abstraction is a common blind spot in typed REST wrappers. Different endpoints within the same vendor often use different pagination contracts (jira.js exposes this directly: v2 uses `startAt/maxResults/total`; v3 uses `nextPageToken`). Any team adopting a typed REST client should audit pagination surface area before committing. — [Atlassian rate-limiting docs](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/)
- **⚠️ [UNVERIFIED]** Rate-limit signal propagation — whether `Retry-After` headers surface in the thrown error type — is a common gap in REST clients and was not confirmed for jira.js. Callers building production automation against any typed REST wrapper should verify this in source before relying on it.
- **[LOW]** Peer dependency conflict risk from validation libraries: jira.js v5.3.x requires Zod v4, which is a breaking change from Zod v3. Limited evidence suggests that projects already using Zod v3 elsewhere will need to resolve a peer conflict; severity depends on package manager and monorepo layout. — [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json)

### Vertical-specific risks

- **[MEDIUM]** PAT auth status on Jira Cloud — **see F4b above.** Enterprise environments relying on `personalAccessToken` (Jira Data Center PATs, service accounts) should verify against a live instance before removing the basic-auth workaround; issue #351 appears closed but the resolution is not confirmed as a fix.
- **⚠️ [UNVERIFIED]** OAuth 2.0 token lifecycle: no reviewed source confirms refresh-callback support. Automations using OAuth 2.0 (rather than API tokens) must implement external token-refresh management or assume static-token semantics.
- **[MEDIUM]** Node.js ≥ 20 blocks teams still on Node 18 (EOL October 2025) or earlier. Migration step may be required before adoption. — [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json)

## Counterarguments & Risks

- **Single-maintainer bus factor.** All commits trace to one person. Monthly-to-quarterly release cadence is active but not a substitute for multi-maintainer resilience. Any production integration with a long expected lifetime needs a fork/pinning contingency.
- **Shared-root evidence.** Most findings (F1, F2, F3, F4a, F4b, F5, F8, F9, F10) rest on sources controlled by the same maintainer (README, package.json, CHANGELOG, docs site, issues). The competitive-landscape finding (F6) is the only HIGH-confidence finding because it draws on sources outside the repository.
- **Type quality unmeasured.** Bundled types are confirmed present; their correctness against actual Jira API responses is not. If types are hand-maintained and stale, the primary DX advantage over direct `fetch`/`axios` erodes.
- **Direct-fetch alternative.** Given the absent abstractions (pagination, rate-limit backoff, OAuth refresh), the real decision is jira.js vs. a minimal direct-fetch wrapper — not jira.js vs. another library. The typed-surface advantage justifies jira.js for most TypeScript teams, but the gap is narrower than "use the library" suggests.
- **ESM transition roughness.** v5.1.1 and v5.3.1 both shipped fixes for ESM regressions. Teams using complex bundler setups (Webpack Node-imports handling, Angular builds) should expect configuration work.

## Gaps & Unknowns

- **G1 — Type generation methodology and accuracy.** Whether types are generated from Atlassian's OpenAPI spec or hand-written, and how accurately they track actual API responses, is unknown. Fill path: inspect `src/` and devDependencies for `openapi-typescript` or similar tooling.
- **G2 — Issue #351 resolution detail.** Issue #351 appears closed per 2026-04-19 spot-check, but the reason (fix vs. wontfix vs. duplicate) is not confirmed. Fill path: read full issue page including comments, cross-reference against v5.1.x–v5.3.x CHANGELOG entries, and test PAT auth against a live Jira Cloud instance.
- **G3 — OAuth 2.0 token refresh support.** Whether the `Config` type exposes `onTokenRefresh` or an equivalent callback. Fill path: source inspection.
- **G4 — jira.js weekly download count.** Exact adoption scale relative to the abandoned `jira-client` (216k weekly). Fill path: `https://api.npmjs.org/downloads/point/last-week/jira.js`.
- **G5 — Retry-After propagation in HttpException.** Whether the library surfaces Jira's rate-limit header in error objects. Fill path: source inspection of `HttpException` and axios interceptor configuration.

## TypeScript Usage Example

Working example, version-pinned, all imports included. Assumes Node.js ≥ 20 and `jira.js@5.3.1`.

```typescript
// npm install jira.js@5.3.1
import { Version3Client } from "jira.js";

// Basic auth is the confirmed-working auth mode. Issue #351 (PAT auth 403 bug)
// appears closed as of April 2026 but the fix is not confirmed — see F4b.
const client = new Version3Client({
  host: "https://your-tenant.atlassian.net",
  authentication: {
    basic: {
      email: process.env.JIRA_EMAIL!,
      apiToken: process.env.JIRA_API_TOKEN!,
    },
  },
});

// No built-in pagination — callers own the nextPageToken loop for v3 endpoints.
async function searchAllIssues(jql: string): Promise<unknown[]> {
  const results: unknown[] = [];
  let nextPageToken: string | undefined;
  do {
    const page = await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
      jql,
      nextPageToken,
      maxResults: 100,
    });
    results.push(...(page.issues ?? []));
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);
  return results;
}

// v2 endpoints use startAt/maxResults/total — a different pagination contract.
// If you use Version2Client.issueSearch, you must loop on startAt instead of nextPageToken.
```
