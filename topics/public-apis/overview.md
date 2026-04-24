---
title: Public APIs Repository
tags: [research, api-discovery]
created: 2026-04-15
status: complete
---

# Public APIs Repository

## What It Is

Public-APIs is a GitHub-hosted, MIT-licensed directory listing approximately 1,400 free public APIs organized into 40+ categories (Animals, Anime, Blockchain, Finance, Health, News, Weather, and more). Each entry includes metadata: authentication type, HTTPS support, and CORS compatibility. The repository has accumulated 421,532 GitHub stars (April 2026; real-time data updates weekly—verify current ranking via [Github-Ranking](https://github.com/EvanLi/Github-Ranking)), making it the 4th most-starred repository globally. The project launched in the mid-2010s and became a prominent API discovery reference, particularly following its public launch and adoption across developer communities.

## Source Domain

- **Native context:** Open-source software development, API discovery tooling, and developer productivity. According to Postman's 2025 State of the API Report, 34% of developers report difficulty finding existing APIs, and 55% struggle with inconsistent documentation across teams.
- **Why that context matters:** The public-apis approach—centralized listing, community contribution model, MIT licensing—emerged from and reflects open-source community norms (transparency, reusability, decentralized governance). These assumptions are critical for understanding its credibility crisis and market position.

## Governance Status

**Note:** The public-apis repository experienced a governance crisis originating in March 2022, when APILayer (a commercial API marketplace company) took ownership and downgraded volunteer maintainers' access levels. In 2024–2025, four volunteer maintainers (matheusfelipeog, pawelborkar, marekdano, yannbertrand) revived the dormant project, resolving 300+ open PRs and stalled issues, only to have their access levels downgraded again without explanation. Maintainers issued a public warning in 2025: "We cannot ensure it's safe." As of April 2026, governance remains unresolved.

**Objectivity Note:** This analysis relies on maintainer testimony (GitHub Issue #3104, DEV Community article) due to lack of public APILayer response. Independent verification would require a direct company statement.

## Generalizable Value

- **Reusable pattern 1 — Static API lists as discovery entry point:** A curated, categorized directory reduces search friction for initial API exploration. Metadata fields (auth type, HTTPS, CORS) enable filtering. MIT licensing permits derivatives and secondary distribution.
- **Reusable pattern 2 — Fork ecosystems as distribution strategy:** The public-apis data has spawned derivatives (public-api-lists with 730+ APIs and searchable web UI; apis-collection emphasizing JSON structure for automation; Free-APIs as static site for cached lookups). This shows how a single data asset can be re-distributed for different user personas.
- **Reusable pattern 3 — Corporate ownership conflicts in community projects:** The public-apis governance crisis illustrates a systemic risk: when corporate entities acquire high-traffic community projects, maintainers can be locked out despite demonstrating capability and commitment. This pattern generalizes to any open-source acquisition.

## Key Concepts

- **API discovery friction:** The challenge of locating existing APIs without duplication or integration friction; affects 34% of developers according to Postman's 2025 survey.
- **Metadata standardization:** API entries include authentication requirements, protocol support (HTTP/HTTPS), and cross-origin compatibility—attributes that enable filtering and integration decisions.
- **Link rot:** Documented dead or broken API entries (FTX documentation link, Firebase Dynamic Links shutdown, Instagram API restrictions, 0x API returning 404s) with unquantified scope.
- **Free tier degradation:** APIs listed as "free" have been progressively monetized, restricted, or deprecated post-listing without tracking (Google Gemini reduced from 500 to 100 daily requests—80% cut; OpenAI free credits removed; widespread paywalling across AI/LLM APIs).
- **Community curation → corporate control transition:** The repository operated under community pull requests through 2024, then shifted to APILayer-controlled governance in 2025–2026.
- **Market fragmentation:** API discovery is fragmenting toward specialized platforms (Zyla with SLA guarantees, Postman API Network, cloud marketplaces), automated discovery tools (Levo.ai, Traceable.ai), and specialized forks.
- **Commercialization intent:** APILayer operates the public-apis repository explicitly to drive traffic to its commercial API Marketplace (launched 2022, 15% revenue share model).

## Context

- **Developers and architects** exploring API categories to understand the ecosystem or benchmark integration options.
- **Product teams** assessing API discovery as a solution to internal documentation fragmentation (93% of API teams report scattered documentation across Slack, Confluence, Git).
- **Tool builders** considering whether to integrate or fork public-apis as a data source.
- **Organizations evaluating API governance strategies** considering centralized discovery catalogs versus distributed team-owned APIs.

## Key Numbers / Stats

- **1,400+ APIs** across 40+ categories [publicapis.dev](https://publicapis.dev/), [GitHub](https://github.com/public-apis/public-apis) — HIGH confidence (official sources)
- **421,532 GitHub stars** (April 2026; real-time data updates weekly—verify current ranking via [Github-Ranking](https://github.com/EvanLi/Github-Ranking)), ranking 4th globally — HIGH confidence (ranking is stable; star count is a snapshot)
- **55% struggle with inconsistent documentation** [Postman 2025](https://www.postman.com/state-of-api/2025/) — MEDIUM confidence
- **93% of API teams report collaboration blockers** (scattered documentation across platforms) [Kong Inc.](https://konghq.com/blog/engineering/api-a-rapidly-changing-landscape) — MEDIUM confidence
- **5-10 documented dead APIs** confirmed (FTX, Firebase, Instagram, Studio Ghibli, 0x, Bitcambio) [GitHub Issue #4805](https://github.com/public-apis/public-apis/issues/4805), [PR #4223](https://github.com/public-apis/public-apis/pull/4223) — MEDIUM confidence; scope unquantified (critical gap: true count unknown, estimated 5-10% = 70-140 of 1,400)
- **Free tier cuts documented:** Google Gemini API reduced from 500 to 100 daily requests (80% cut) in December 2025 [FindSkill.ai](https://findskill.ai/blog/gemini-api-pricing-guide/); OpenAI removed generous free credits; widespread paywalling across AI/LLM APIs (2025–2026) — MEDIUM-HIGH confidence (pattern verified; scope unmeasured)

## Links

- [Public APIs — Official Website](https://publicapis.dev/)
- [GitHub — public-apis/public-apis](https://github.com/public-apis/public-apis)
- [GitHub Issue #3104 — Public APIs Situation (Governance Crisis)](https://github.com/public-apis/public-apis/issues/3104)
- [DEV Community — Public APIs Situation](https://dev.to/yannbertrand/public-apis-situation-4101) (by maintainer yannbertrand)
- [GitHub — public-api-lists/public-api-lists (Fork)](https://github.com/public-api-lists/public-api-lists)
- [GitHub — tools-collection/apis-collection (Fork)](https://github.com/tools-collection/apis-collection)
- [Free APIs — Static Site Distribution](https://free-apis.github.io/)
- [Postman 2025 State of the API Report](https://www.postman.com/state-of-api/2025/)
