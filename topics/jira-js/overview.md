---
title: jira.js
tags: [research]
created: 2026-04-19
status: complete
---

# jira.js

## What It Is

jira.js (MrRefactoring/jira.js, v5.3.1) is a typed JavaScript/TypeScript client for Atlassian's Jira Cloud REST API. It exposes four client classes that wrap the Jira Cloud Platform v2/v3, Jira Software (Agile), and Jira Service Management endpoints, ships its own TypeScript definitions, and outputs both ESM and CJS. It is a REST wrapper, not an integration SDK — auth flows beyond static credentials, pagination, and retry logic are the caller's responsibility.

## Source Domain

- **Native context:** JavaScript/TypeScript automations that talk directly to Jira Cloud's REST API — internal tools, bots, sync workers, and CLIs that need typed access to issues, sprints, boards, and service desk resources.
- **Why that context matters:** The library's design assumes a Node.js backend with long-lived credentials (API tokens or pre-exchanged OAuth access tokens) and callers who are comfortable writing their own pagination and backoff loops. It is not shaped for browser-first apps, Forge Marketplace apps, or teams expecting a batteries-included integration framework.

## Generalizable Value

- **Reusable pattern:** Typed REST client architecture — split a large API surface into class-per-product-area, ship hand-maintained or OpenAPI-generated `.d.ts` files with the package, expose subpath exports for tree-shaking, and keep the runtime dependency footprint minimal.
- **Cross-vertical relevance:** The same pattern applies to any vendor that publishes a broad REST API without an official JS SDK. The architectural lesson — and the gaps jira.js exhibits (no pagination, externalized OAuth lifecycle, unverified rate-limit signaling) — generalizes to most typed REST wrappers.

## Key Concepts

- **Version2Client / Version3Client:** Wrappers over Jira Cloud Platform REST v2 and v3. v2 and v3 use different pagination models (`startAt` vs `nextPageToken`).
- **AgileClient:** Covers Jira Software endpoints (sprints, boards, backlog).
- **ServiceDeskClient:** Covers Jira Service Management endpoints.
- **Subpath exports:** `jira.js/version2`, `/version3`, `/agile`, `/serviceDesk` enable importing only the client you need.
- **Auth config:** Accepts `basic` (email + apiToken), `oauth2` (pre-obtained accessToken pass-through), or `personalAccessToken` (currently broken — see notes).
- **HttpException:** Error type thrown on non-2xx responses. Field shape for rate-limit headers is not documented in reviewed sources.
- **Bundled types:** `.d.ts` files ship in the package; no `@types/jira.js` needed.
- **Dual ESM/CJS:** v5.0.0+ ships both formats; ESM transition had regressions fixed through v5.3.1.

## Context

- Used by TypeScript/Node.js teams building internal Jira automations where typed access matters and the alternative is hand-rolling axios calls.
- Chosen when there is no official Atlassian JS SDK (there isn't) and the maintained-alternatives field is empty — `jira-client` and `jira-connector` are both abandoned.
- Not appropriate as-is for production-scale automations until pagination loops and rate-limit backoff are layered on by the caller.
- Not the right tool for Forge Marketplace apps, which use Atlassian's Forge platform and bindings.

## Key Numbers / Stats

- Four client classes cover Jira Cloud Platform v2/v3, Agile, and Service Management. [README](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/README.md) — **[MEDIUM]**
- Current version v5.3.1, published January 2025 (~15 months prior to April 2026); v5.x produced 6+ releases during ESM stabilization. [CHANGELOG](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/CHANGELOG.md) — **[MEDIUM]**
- 476 stars, 61 forks, 21 open issues. [GitHub](https://github.com/mrrefactoring/jira.js/) — **[MEDIUM]**
- Runtime dependencies: `axios ^1.13.5`, `mime-types ^2.1.35`, `zod ^4.3.6` (three total). [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json) — **[MEDIUM]**
- Node.js ≥ 20 hard requirement. [package.json](https://raw.githubusercontent.com/MrRefactoring/jira.js/master/package.json) — **[MEDIUM]**
- Competing library `jira-client` has 216k weekly downloads but last updated 3 years ago; `jira-connector` is 6 years stale. [npmtrends](https://npmtrends.com/jira-client-vs-jira-connector-vs-jira-rest-client) — **[HIGH]**
- No official Atlassian JavaScript REST SDK exists. [Atlassian developer docs](https://developer.atlassian.com/cloud/jira/platform/apis/document/libs/) — **[HIGH]**

## Links

- [jira.js repository](https://github.com/MrRefactoring/jira.js)
- [Official jira.js documentation site](https://mrrefactoring.github.io/jira.js/)
- [Atlassian Jira Cloud REST API reference](https://developer.atlassian.com/cloud/jira/platform/rest/)
- [Atlassian rate-limiting guide](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/)
- [Atlassian developer library guide](https://developer.atlassian.com/cloud/jira/platform/apis/document/libs/)
