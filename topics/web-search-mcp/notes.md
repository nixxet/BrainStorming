---
title: web-search-mcp — Research Notes
tags: [research, findings, mcp, security]
created: 2026-04-20
---

# web-search-mcp — Research Notes

## Key Findings

### Security Vulnerabilities

**[CRITICAL→HIGH in web-search-mcp context]** CVE-2026-2441: Use-after-free vulnerability in Chromium CSS handler, actively exploited in the wild. Affects Playwright v1.58.2 (released Feb 6, 2026); fix available in Chromium 146.0.7680.31+. web-search-mcp renders search results HTML in headless Chromium; attackers can trigger RCE via crafted HTML in search results (SEO poisoning). Process compromise → access to browser memory, cached queries, session data. No patched Playwright release yet as of April 20, 2026 [GitHub Playwright #39574].

**[HIGH]** SSRF (Server-Side Request Forgery) vulnerability rate in URL-accepting MCP servers is 36.7% — Two independent security scans (dev.to: 5,618 servers; BlueRock Security: 7,000+ servers) both arrived at identical 36.7% rate. Any MCP server parsing untrusted URLs faces identical architectural risk. Must implement strict URL allowlisting and internal-network blocking before production deployment. Requires explicit rejection of reserved IP ranges (RFC 5735: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1, ::1) and metadata endpoints (169.254.169.254).

**[MEDIUM-HIGH]** Prompt injection via search results succeeds 72.8–100% in academic studies; 84.2% with auto-approval agents — Four independent peer-reviewed studies (MCPTox tested 45 live MCP servers, 353 tools, 1,312 malicious test cases; Breaking the Protocol tested 847 attack scenarios; MCPTox meta-analysis) document success rate range. web-search-mcp returns full page content, expanding injection surface beyond snippet-only alternatives. Real-world case: Supabase's Cursor agent exfiltrated tokens via poisoned search results.

**[HIGH]** MCP protocol lacks client-side cryptographic verification of server behavior — Microsoft Security Blog + academic papers confirm the MCP specification does not provide cryptographic verification. Clients cannot detect if servers fabricate, modify, or exfiltrate data without client-side verification mechanisms. This is a structural protocol limitation, not implementation-specific. Applies universally to all MCP deployments. MCP Safety Audit (ArXiv 2504.03767v2) documents that untrusted servers can exfiltrate data from co-connected trusted servers through shared agent context.

**[MEDIUM-HIGH]** CVE-2025-9611 (Microsoft Playwright MCP Server CSRF/DNS rebinding) demonstrates MCP-layer authentication gaps — CVE affects Playground MCP Server <v0.0.40; unvalidated Origin headers allow DNS rebinding attacks. Attacker can intercept requests from MCP clients or exfiltrate data. Microsoft fixed in v0.0.40 by adding allowedHosts configuration. web-search-mcp documentation does not mention origin validation or CSRF protection; assume missing. Pattern demonstrates that MCP servers frequently miss authentication/origin validation. Defense requires: validated Origin header, API key authentication, or deployment on localhost only with firewall-enforced client IP restrictions.


### Operational & Compliance Risks

**[MEDIUM-HIGH at scale]** ToS violations via headless browser scraping — Bing Search APIs require API key authentication; DuckDuckGo officially states no public search results API exists; Brave eliminated free tier Feb 2026, forcing metered API keys. web-search-mcp scrapes all three via browser automation without keys, violating ToS. Risk: IP bans, service suspension, legal action from search engine providers. Risk severity depends on deployment scale: academic/personal use <100 queries/day unlikely to trigger enforcement; production deployment >10k queries/day at high risk. Mitigation options: switch to official APIs (Tavily $0.001/query, Brave API 2,500 free/month tier) or implement IP rotation + request throttling.

**[MEDIUM]** Single-maintainer abandonment risk — GitHub profile shows mrkrsl as sole maintainer with no visible governance or succession planning. Latest release v0.3.2 (Aug 2025) is 8.5 months old. 17 open issues unresolved for months (LM Studio integration #16, #17; Cold Turkey compatibility #9). Comparison: Official Anthropic MCP Brave Search server was archived within months, demonstrating precedent for vendor-backed MCP server abandonment.

**[MEDIUM]** Cost trade-off masks infrastructure overhead — "No API keys required" markets as privacy-first simplicity but masks hidden costs: Headless browser infrastructure (~$10–50/month self-hosted, $30–100 cloud-managed). True cost comparison: Brave API (1,000 queries/month) = $5 vs web-search-mcp self-hosted = $10–50 based on cloud compute rates. TCO depends heavily on deployment context (self-hosted vs cloud) and usage volume.

**[MEDIUM]** npm supply chain risk with Playwright dependency — September 2025 npm phishing campaign (18 packages, 2.6B downloads/week compromised) and Shai-Hulud worm (first wormable npm malware, 25k+ repos affected by Nov 2025) demonstrate that Playwright dependency tree faces active supply chain attacks. Transitive dependencies add risk surface. Mitigation: pin Playwright version, audit transitive dependencies monthly, run npm audit in CI/CD, monitor GitHub security advisories for Playwright/Chromium.

### Performance & Reliability

**[MEDIUM]** Headless browser automation introduces 10–30x latency overhead vs direct HTTP API calls and requires resource-intensive process management — Industry baseline (Browserbase) well-established. web-search-mcp-specific impact inferred from 6-second default timeout and multi-engine fallback retry logic (not directly measured). Worst-case scenario: 12–18 second latency if multi-engine fallback triggers on first two engines. Resource concern: Playwright consumes 100–300 MB per browser instance; multi-engine fallback (Bing→Brave→DuckDuckGo) spawns 3+ concurrent instances, risking 300–900 MB per request. No documented resource limits or memory monitoring in web-search-mcp; OOM risk on resource-constrained deployments. No published benchmark data available.

**[MEDIUM-HIGH (unconfirmed)]** Brave fallback reliability post-Feb 2026 anti-scraping escalation — Brave eliminated free tier Feb 2026 and monetized API. web-search-mcp uses browser-based access (not API), so not directly affected. Headless browser detection evolved: navigator.webdriver, TLS JA3 fingerprinting, HTTP header analysis now industry standard. web-search-mcp does NOT implement stealth headers, TLS fingerprint spoofing, or navigator.webdriver evasion. No published CVE or GitHub issue confirms Brave blocks web-search-mcp as of April 2026, but TLS fingerprinting arms race suggests blocks are likely in development or partial rollout. Verdict.md should add: "Brave fallback reliability unconfirmed post-Feb 2026. Monitor GitHub issues for block reports. If Brave blocks escalate, system degrades to DuckDuckGo 10% accuracy."

**[MEDIUM]** Search accuracy varies dramatically across fallback engines — Bing achieved 64% accuracy, DuckDuckGo lagged at 10% (AIMultiple, AgentRank benchmarks 2026). Firecrawl (dedicated browser-automation scraper) achieved 83% with 7-second latency. web-search-mcp prioritizes Bing, degrading to lower-accuracy engines on failure—cascading accuracy risk if primary engine fails under load.

**[LOW]** LM Studio integration documented as broken — GitHub README claims "developed and tested with LM Studio and LibreChat" but open issues #16 ("Plugin process exited unexpectedly with code 1") and #17 ("Can this be used in API calls?") document LM Studio integration failures unresolved for months. Advertised testing scope contradicted by evidence of failures. Compatibility with other clients (Claude Desktop, Cursor, VS Code) theoretically possible via standardized JSON configuration but not experimentally verified. Do not rely on LM Studio integration without confirming locally.

### Architecture & Feature Set

**[HIGH]** Multi-engine fallback strategy: Bing (primary) > Brave > DuckDuckGo with isolated browser instances — Official documentation confirms each engine uses isolated browser instances (Chromium for Bing, Firefox for Brave, Axios for DuckDuckGo) with automatic cleanup between searches. Architecture prioritizes reliability over performance by cascading through three engines.

**[HIGH]** Three specialized tools with documented parameters — Official API documentation specifies: (1) full-web-search (comprehensive with full page content), (2) get-web-search-summaries (snippet-only results), (3) get-single-web-page-content (URL-specific extraction). Rate limited to 10 requests per minute; configurable result limits (1–10, default 5).

**[HIGH]** "No API keys required" technically accurate but characterization incomplete — web-search-mcp requires no API keys; browser-based access confirmed by code analysis (no BRAVE_API_KEY environment variable exists). However, marketing frames this as "privacy-first simplicity" while concealing: (1) ToS violations, (2) infrastructure overhead, (3) single-maintainer maintenance burden. Feature is fact (HIGH); characterization is incomplete (MEDIUM).

**[HIGH]** Technology stack: TypeScript/Node.js (18+/npm 8+) with Playwright browser automation — Official documentation confirms Playwright supports Chromium, Firefox, WebKit with auto-waiting, concurrent page handling, and accessibility snapshots. Standard Node.js/Playwright deployment pattern.

**[HIGH]** Rate limiting enforced at 10 requests per minute — Official API documentation explicitly specifies limit. Standard consideration for agent design; requires caching, batching, or exponential backoff.

### Competitive Landscape & Alternatives

**[HIGH]** Competitive landscape includes four distinct architectural approaches — (1) API-based: Brave, Tavily, Exa, Serper (require keys, real-time); (2) self-hosted multi-engine: web-search-mcp, open-webSearch (no keys, local); (3) browser-automation-first: Firecrawl, Playwright MCP (managed service); (4) single-engine free: DuckDuckGo MCP. AgentRank 2026 rankings: Tavily 81.36, Exa 76.64, Firecrawl 73.94, Brave 70.32, Apify 64.4.

**[HIGH]** open-webSearch is a direct architectural competitor — Aas-ee's project supports 8+ search engines (Bing, Baidu, CSDN, DuckDuckGo, Exa, Brave, Juejin, StartPage) with optional browser fallback (Playwright). Deployable as MCP server, CLI, HTTP daemon, or skill layer. No API keys required. Feature parity with web-search-mcp but broader engine support.

**[HIGH]** No published benchmark includes web-search-mcp performance data — web-search-mcp absent from all published 2025–2026 MCP benchmarks: AIMultiple, MCPBench, Fastio, ArXiv. Cannot directly compare latency/accuracy to alternatives (Tavily, Firecrawl, Brave, DuckDuckGo) from peer-reviewed benchmarks. Critical gap for production recommendation.

### Community & Adoption

**[HIGH]** GitHub adoption: 781–783 stars, 115–116 forks as of Q1 2026 — Multiple independent snapshots confirm metrics. Positions web-search-mcp as moderately popular option among 1,200+ MCP servers in official registry. Star/fork counts are proxy for interest but do not validate technical quality.

**[MEDIUM]** Model compatibility: Qwen3 and Gemma 3 achieve optimal results; Llama/Deepseek compatibility varies with version — Glama registry lists optimal models; notes compatibility variance with older model versions. Single primary source; no supporting benchmark data.

## Contradictions & Resolutions

**Contradiction 1: "No API Keys Required" (Fact vs Risk)**
- *Landscape position:* Enables fully local, privacy-respecting deployment without sharing search queries with cloud vendors.
- *Gap-Fill finding:* Technically accurate—Brave integration uses headless browser, not API calls.
- *Deep-Dive challenge:* Masks ToS violations and creates operational risk (IP bans, service suspension).
- *Resolution:* Both claims correct; they address different aspects. Feature is accurate (HIGH confidence on technical fact) but benefit characterization is incomplete (MEDIUM on risk characterization). Must present both in recommendation.

**Contradiction 2: LM Studio/LibreChat Testing ("Tested" vs "Broken")**
- *Landscape position:* "Developed and tested with LM Studio and LibreChat."
- *Evidence:* GitHub issues #16, #17 document integration failures unresolved for months.
- *Resolution:* Testing occurred but reliability is unsupported. Advertised compatibility does not survive adversarial scrutiny. Downgrade from IMPLIED HIGH (by README) to LOW (by evidence). Flag that testing scope claim contradicts documented failures.

## Gaps & Unknowns

### Critical Gaps

**Gap C1: No Direct Performance Benchmark for web-search-mcp**
- Published MCP benchmarks (AIMultiple, MCPBench, ArXiv, Fastio) test Firecrawl, Brave, Tavily, DuckDuckGo, and others—but exclude web-search-mcp.
- Cannot compare latency/accuracy directly to alternatives from peer-reviewed sources.
- Impact: HIGH — Prevents confident claim that web-search-mcp meets specific performance SLAs.

### Significant Gaps

**Gap S1: No Public Security Audit**
- No CVE, no third-party security review, no hardening documentation.
- 82% of MCP servers have vulnerabilities; web-search-mcp's status unknown.
- Impact: MEDIUM-HIGH — Blocks production deployment in sensitive data contexts without internal security assessment.

**Gap S2: Prompt Injection Defense Mechanisms Undocumented**
- No evidence of text sanitization, instruction filtering, or prompt injection hardening in web-search-mcp.
- MCP protocol has no built-in defenses; implementation-level controls (if any) not documented.
- Impact: MEDIUM — Agents vulnerable to tool poisoning without explicit defense layer.

**Gap S3: Brave Anti-Scraping Post-Feb 2026 Unclear**
- Brave eliminated free tier Feb 2026 and monetized API.
- web-search-mcp uses browser-based access (not API), so not directly affected.
- Unclear if Brave implemented anti-scraping measures (CAPTCHA, JS challenges) that would break fallback.
- No GitHub issues report "Brave fallback broken" as of April 2026, but risk unquantified.
- Impact: MEDIUM — If Brave blocked headless scraping, fallback collapses to DuckDuckGo (10% accuracy).

## Confidence Summary

- **HIGH:** 10 findings (SSRF 36.7%, MCP protocol insecurity, multi-engine fallback, three tools, adoption 781–783 stars, competitive landscape 4 archs, open-webSearch competitor, rate limiting 10 req/min, tech stack TypeScript/Playwright, prompt injection exploitability, no benchmark coverage)
- **MEDIUM-HIGH:** 1 finding (Prompt injection 72.8–100% success)
- **MEDIUM:** 6 findings (Latency 10–30x overhead, single-maintainer risk, ToS violations, search accuracy variance 64%–10%, model compatibility Qwen3/Gemma3, cost overhead $10–50/month)
- **LOW:** 1 finding (LM Studio compatibility unsupported)
- **UNVERIFIED:** 0 findings

## Cross-Vertical Risk Assessment

### Reusable Across All Domains
- SSRF and prompt injection vulnerabilities apply to any MCP server parsing URLs or returning user-controlled content
- Browser automation latency overhead applies to any web-scraping-based search tool
- Single-maintainer abandonment risk applies to any OSS project
- ToS violation risk applies to any headless browser scraping without official APIs
- MCP protocol security limitations affect all MCP deployments

### Source-Domain-Bound
- Model compatibility (Qwen3, Gemma 3 optimal) specific to LLM model selection
- LM Studio integration failures specific to that client
- Bing/DuckDuckGo accuracy specific to web search quality

### Requires Manual Validation
- 10 req/min rate limit acceptable for some use cases (human-in-the-loop), problematic for others (high-volume agentic research)
- 6-second default timeout + fallback retry may work for some networks; degraded networks require testing
- Node.js/Playwright stack requires Node.js runtime; not compatible with Python-only or serverless without containerization
