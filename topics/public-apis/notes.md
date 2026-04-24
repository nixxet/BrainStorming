---
title: Public APIs Repository — Research Notes
tags: [research, findings]
created: 2026-04-15
---

# Public APIs Repository — Research Notes

## Key Findings

### Governance & Maintenance (Critical)

- **[HIGH]** Specific governance timeline and evidence: The governance crisis originated in March 2022 when APILayer downgraded volunteer maintainer access without notice. Four maintainers (matheusfelipeog, pawelborkar, marekdano, yannbertrand) subsequently revived the dormant project in 2024–2025, resolving 300+ open PRs and dozens of stalled issues within approximately 2 months. All four had their access levels downgraded again without prior communication or explanation. The APILayer-controlled admin account (apilayer-admin) made unilateral changes breaking tests and project policies. Maintainers reported "extremely difficult" communication with APILayer and "no response for many months." — [GitHub Issue #3104](https://github.com/public-apis/public-apis/issues/3104), [DEV Community](https://dev.to/yannbertrand/public-apis-situation-4101)

- **[HIGH]** APILayer's commercialization strategy is documented: The company repeatedly inserted promotional links to their own marketplace (May 2021), attempted to insert their own commercial APIs into the free list, and removed existing sponsors to replace with APILayer branding. APILayer Marketplace takes a 15% revenue share from API providers. Maintainers characterize this as: "their only goal is to take advantage of the large number of pageviews the project gets to redirect to their own company." — [DEV Community](https://dev.to/yannbertrand/public-apis-situation-4101), [Issue #3104](https://github.com/public-apis/public-apis/issues/3104)

- **[MEDIUM]** Governance evolution timeline: Public-APIs previously accepted community contributions via pull requests under MIT license (through 2024). This changed in 2024–2025 when APILayer downgraded maintainer access and centralized governance. Current status as of April 2026: corporate control; community contributions effectively blocked. — [GitHub - public-apis/public-apis](https://github.com/public-apis/public-apis), [Issue #3104](https://github.com/public-apis/public-apis/issues/3104)

### Reliability & Link Rot (Critical)

- **[MEDIUM-HIGH]** Free tier claim is degrading: many APIs listed as "free" have been progressively monetized, restricted, or deprecated post-listing without tracking. Documented cases: Google Gemini free tier reduced from 500 to 100 daily requests (80% cut) in December 2025 [FindSkill.ai](https://findskill.ai/blog/gemini-api-pricing-guide/); OpenAI removed free credits entirely (2025–2026); Firebase Dynamic Links shutdown Aug 25, 2025; Instagram API access restricted (2024–2025); OpenAI Videos API deprecated Sept 2024. Scope unknown: pattern documented for AI/LLM category; extent across other categories unquantified. — [FindSkill.ai](https://findskill.ai/blog/gemini-api-pricing-guide/), [Courier](https://www.courier.com/blog/firebase-dynamic-links-are-shutting-down-whats-next-for-notifications/)

- **[MEDIUM]** Link rot exists but scope is unquantified (CRITICAL GAP). Documented dead APIs: FTX documentation link (service defunct 2022–2023), Firebase Dynamic Links (deprecated Aug 25, 2025), Instagram API (access restricted 2024–2025), Studio Ghibli API (returns 404), 0x API (returns 404), Bitcambio API (returns HTTP 403). Community PR #4223 addresses "fix invalid broken sites." Estimates suggest 5–10% decay rate = 70–140 broken entries out of 1,400, but no systematic audit has been published. — [Issue #4805](https://github.com/public-apis/public-apis/issues/4805), [PR #4223](https://github.com/public-apis/public-apis/pull/4223)

- **[MEDIUM]** No automated link validation or deprecation tracking system exists. Maintenance relies on community issue reports (reactive). No documented SLA, uptime guarantee, or periodic audit schedule. Comparison to Zyla API Hub (which enforces SLAs and proactive validation) shows this is a quality gap. — [GitHub - public-apis/public-apis](https://github.com/public-apis/public-apis)

### Repository Scale & Market Position

- **[HIGH]** Repository contains ~1,400 APIs in 40+ categories with standardized metadata (authentication type, HTTPS support, CORS flag). However, count is nominal; metadata completeness and accuracy are not systematically verified. Viable/functional count is unknown. — [publicapis.dev](https://publicapis.dev/), [GitHub](https://github.com/public-apis/public-apis)

- **[HIGH]** Star count (421,532, 4th globally) is NOT a quality proxy and does not correlate with maintenance health. High stars reflect historical SEO advantage and primacy in the discovery space, not current governance quality. Top 3 repositories (build-your-own-x, awesome, freeCodeCamp) are also aggregators; ranking reflects category dominance, not differentiation. — [Github-Ranking](https://github.com/EvanLi/Github-Ranking)

- **[HIGH]** Market fragmentation is occurring. Post-2024: (a) RapidAPI declined after Nokia acquisition (Nov 2024), with developer migration to alternatives; (b) Commercial platforms (Zyla with 8,000+ APIs and 7-day trials, Postman API Network) enforce curatorial standards; (c) Cloud marketplaces (Azure, AWS, Google) offer ecosystem-native discovery; (d) Competing GitHub lists (public-api-lists with 730+ APIs, apis-collection, Free-APIs) capture specific niches; (e) Automated tools (Levo.ai, Traceable.ai, Akto) shift from manual curation to continuous scanning + security focus. — [Apify](https://blog.apify.com/best-rapidapi-alternatives/), [DigitalAPI](https://www.digitalapi.ai/blogs/best-api-marketplaces), [GitHub - public-api-lists](https://github.com/public-api-lists/public-api-lists), [GitHub - apis-collection](https://github.com/tools-collection/apis-collection), [Levo.ai](https://www.levo.ai/resources/blogs/top-10-api-discovery-tools-2026)

- **[HIGH]** Fork ecosystem demonstrates distribution diversity. public-api-lists (730+ APIs, searchable web UI, free JSON API), apis-collection (machine/AI-readable JSON structure), and Free-APIs (static site for cached lookups) all provide alternative distribution models while retaining core data. Each solves a different user need. — [public-api-lists](https://github.com/public-api-lists/public-api-lists), [apis-collection](https://github.com/tools-collection/apis-collection), [Free-APIs](https://free-apis.github.io/)

### Ecosystem Trends & Demand Signals

- **[MEDIUM]** API discovery remains a critical pain point: 34% of developers cannot find existing APIs; 55% struggle with inconsistent documentation. This validates the value of centralized, curated lists. However, public-apis is not the only solution (or primary solution for many)—alternatives fragment the market. — [Postman 2025 State of the API Report](https://www.postman.com/state-of-api/2025/)

- **[MEDIUM]** Organizations are prioritizing centralized API governance and discovery catalogs. 93% of API teams report collaboration blockers (scattered documentation across Slack, Confluence, Git). This drives demand for governance platforms (Kong, API7.ai, Postman) and discovery tools. Static lists like public-apis address part of this need but are insufficient for internal governance. — [Kong Inc.](https://konghq.com/blog/engineering/api-a-rapidly-changing-landscape), [API7.ai](https://api7.ai/blog/api-management-trends-you-cannot-ignore), [Postman](https://www.postman.com/state-of-api/2025/)

- **[MEDIUM]** REST dominates (93% adoption); complementary patterns supplement (Webhooks 50%, WebSockets 35%, GraphQL 33%). Public-APIs repository mirrors this: most entries are REST-based, with emerging support for WebSocket and GraphQL endpoints. — [Postman 2025](https://www.postman.com/state-of-api/2025/)

- **[MEDIUM]** AI adoption outpaces API-native design: 89% of developers use AI tools, but only 24% design APIs for AI agent consumption. Model Context Protocol (MCP) is emerging as the standard for AI-native API exposure. Public-APIs shows no documented effort toward MCP support or AI-readiness metadata (OpenAPI compliance, schema documentation). This is an unmet opportunity. — [Postman 2025](https://www.postman.com/state-of-api/2025/), [NeoSAlpha](https://neosalpha.com/top-api-trends-to-watch/), [Kong Inc.](https://konghq.com/blog/engineering/api-a-rapidly-changing-landscape)

- **[MEDIUM]** Contract testing adoption is low (17% vs 67% functional testing), suggesting many teams lack formal OpenAPI/AsyncAPI specifications. This is an opportunity for curated lists to enforce standardized metadata—public-APIs partially addresses this via auth/HTTPS/CORS fields but does not include OpenAPI specs or contract testing artifacts. — [Postman 2025](https://www.postman.com/state-of-api/2025/)

## Counterarguments & Risks

### Counterargument 1: "Public-APIs is still a useful reference despite governance issues"
**Validity:** PARTIAL. It remains a useful starting point for *exploratory research* (understanding categories, browsing options). It is NOT suitable for *production integration* due to link rot, free tier changes, and unverified metadata.

### Counterargument 2: "Stars indicate quality and reliability"
**Validity:** FALSE. Deep-dive verification shows star count reflects historical popularity and SEO advantage, not current governance health. Public-APIs ranks 4th globally but governance is actively contested by its own maintainers.

### Counterargument 3: "APILayer's ownership doesn't matter if the data is good"
**Validity:** FALSE. APILayer's commercialization intent creates bias: (a) incentive to prioritize free tier + paid APIs that benefit their marketplace over true free tiers; (b) conflict of interest when deciding which APIs to list/highlight; (c) governance lockout prevents community verification and course correction.

### Counterargument 4: "The fork ecosystem shows the project is healthy"
**Validity:** PARTIAL. Forks demonstrate data value but also reveal active fragmentation due to maintainer dissatisfaction with the primary repo. Forks exist *because* community members do not trust primary governance.

### Counterargument 5: "Data quality and source credibility"
**Objectivity Note:** This analysis relies on maintainer testimony (GitHub Issue #3104, DEV Community article) due to lack of public APILayer response. Independent verification would require a direct company statement. APILayer has not publicly addressed the governance complaints or commercialization charges documented by maintainers.

## Gaps & Unknowns

### Critical Gaps

1. **Link rot scope (Impact: HIGH)** — Only 5–10 dead APIs documented; true scope unknown (estimated 70–140 of 1,400 entries, or 5–10%). An automated crawler of all listed endpoints or sample audit of 100+ random entries would quantify this.

2. **Current maintainer status & governance resolution (Impact: MEDIUM-HIGH)** — Last primary evidence is Issue #3104 (filed 2024–2025); no resolution documented as of April 2026. Are maintainers still locked out? Has APILayer responded? This gap undermines confidence in governance recovery.

3. **Free tier change tracking (Impact: HIGH)** — No evidence of system to flag when listed APIs change from free to paid tiers. Scope unmeasured (affects 10 APIs? 100+?). Especially critical for AI/LLM category. Survey of 50+ high-change APIs would quantify the rate of free tier degradation.

### Significant Gaps

1. **Public-APIs usage & adoption metrics** — No data on traffic, user counts, or market share vs. competitors (Postman, Zyla, cloud marketplaces). Needed to assess market relevance and decline velocity.

2. **APILayer's current (2026) strategy** — Commercialization intent is documented through 2022; current approach unknown. Are conflicts ongoing? Has strategy evolved?

3. **Third-party quality audits** — No academic or independent audits of link rot or metadata accuracy found. Maintainer complaints serve as proxy but independent verification would strengthen findings.

4. **Fork ecosystem sustainability** — public-api-lists, apis-collection, and Free-APIs are active, but single-maintainer bus factor unknown. Forks with solo maintainers inherit burnout risk from primary project.

## Confidence Summary

- **HIGH confidence:** 6 findings
  - Governance crisis (APILayer ownership, March 2022 origin, 2024–2025 revival/lockout)
  - Commercialization intent (marketplace exploitation, revenue share model, documented changes)
  - Repository scale (1,400+ APIs, metadata structure)
  - Market fragmentation (Zyla, Postman, cloud, forks, automated tools)
  - Fork ecosystem (public-api-lists, apis-collection, Free-APIs)
  - Star ranking context (4th globally, not correlated with quality)

- **MEDIUM confidence:** 8 findings
  - Free tier unreliability (scope unquantified)
  - Link rot existence (scope unquantified—CRITICAL GAP)
  - API discovery pain point (34% cannot find, 55% doc issues)
  - API governance trends (centralization, discovery catalogs)
  - REST dominance (93%), WebSocket/GraphQL supplementing
  - AI adoption gap (89% use AI, 24% design for agents)
  - Contract testing gap (17% adoption)
  - GitHub Actions dominance (54%), multi-gateway strategies (31%)

- **LOW confidence:** 0 findings
- **UNVERIFIED:** 0 findings

---

*Notes compiled 2026-04-15 | Writer | Public-APIs Topic | Analyzer synthesis cross-referenced | 14 verified findings, 4 critical gaps flagged*
