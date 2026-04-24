---
title: web-search-mcp
tags: [research, mcp, web-search, tool]
created: 2026-04-20
status: complete
---

# web-search-mcp

## What It Is

web-search-mcp is a locally-hosted MCP server providing multi-engine web search via headless browser automation (Playwright). It prioritizes Bing, falls back to Brave, then DuckDuckGo—all without requiring API keys or external credentials. Built with TypeScript/Node.js, it exposes three tools: full-web-search (comprehensive results), get-web-search-summaries (snippet-only), and get-single-web-page-content (URL-specific extraction). Rate limited to 10 requests per minute.

## Source Domain

- **Native context:** Open-source agent tooling; self-hosted LLM deployment (LM Studio, LibreChat); privacy-first web search
- **Why that context matters:** The "no API keys" positioning reflects demand for local deployment without sharing queries with cloud vendors. This reflects a specific operator need (local inference + local search) but does not apply universally.

## Generalizable Value

- **Reusable pattern:** Browser-automation-based search architecture generalizes to any multi-engine fallback strategy; architectural lessons transfer to other scraping-based tools
- **Cross-vertical relevance:** SSRF and prompt injection vulnerabilities are universal MCP risks, not domain-specific. Cost trade-off analysis (API vs browser infrastructure) applies wherever latency and operational overhead matter.

## Key Concepts

- **Headless browser automation:** Playwright drives Chromium/Firefox/WebKit to render search engine results pages, extracting content programmatically without API authentication
- **Multi-engine fallback:** Automatically escalates through Bing → Brave → DuckDuckGo if primary engine fails
- **MCP protocol:** Model Context Protocol—standardized interface for LLMs to call external tools; isolates credentials from LLM providers
- **SSRF vulnerability:** Server-Side Request Forgery—an attacker controls the URL passed to web-search-mcp, potentially enabling reconnaissance of internal networks
- **Prompt injection:** Malicious instructions embedded in search results that agents execute if they process results without sanitization
- **ToS compliance risk:** web-search-mcp scrapes search engines (Bing, DuckDuckGo, Brave) without official API authentication, violating their terms of service

## Context

- Used for rapid prototyping with local LLMs where cloud API costs are a barrier
- Deployed in environments prioritizing query privacy (no data sharing with cloud vendors)
- Common in offline/low-connectivity scenarios where external APIs are unavailable
- Growing adoption among open-source LLM communities (LibreChat, LM Studio integrations)

## Key Numbers / Stats

- **GitHub adoption:** 781–783 stars, 115–116 forks as of Q1 2026 [GitHub snapshots] — HIGH confidence
- **Search accuracy by engine:** Bing 64%, DuckDuckGo 10% [AIMultiple, AgentRank 2026 benchmarks] — MEDIUM confidence
- **SSRF vulnerability rate:** 36.7% of MCP servers accepting external URLs [dev.to scan 5,618 servers + BlueRock Security 7,000+ servers] — HIGH confidence
- **Prompt injection success rate:** 72.8–100% in academic studies; 84.2% with auto-approval agents [MCPTox, academic peer-reviewed studies] — MEDIUM-HIGH confidence
- **Headless browser latency overhead:** 10–30x slower than direct API calls [Browserbase industry baseline] — MEDIUM confidence (not web-search-mcp-specific)
- **Maintenance status:** Latest release v0.3.2 (Aug 2025, 8.5 months old); single maintainer (mrkrsl); 17 open issues [GitHub profile analysis] — MEDIUM confidence
- **No benchmark coverage:** Absent from all published 2025–2026 MCP performance benchmarks (AIMultiple, MCPBench, Fastio, ArXiv) — HIGH confidence
- **CVE-2026-2441 (Chromium use-after-free):** Actively exploited zero-day in Playwright dependency. Affects Playwright v1.58.2 (Feb 6, 2026); fix available in Chromium 146.0.7680.31+ [GitHub Playwright #39574] — CRITICAL in Chromium, HIGH in web-search-mcp context

## Links

- [Official GitHub Repository](https://github.com/mrkrsl/web-search-mcp)
- [Glama Registry Entry](https://glama.ai/browse/mcp-servers/web-search)
- [Brave Search MCP (API-based alternative)](https://github.com/anthropics/mcp-servers)
- [open-webSearch (Multi-engine competitor)](https://github.com/Aas-ee/open-webSearch)
- [Unit 42 Prompt Injection Research](https://unit42.paloaltonetworks.com)
- [MCPTox: Testing Tool Poisoning in MCP Servers](https://mcptox.org)
