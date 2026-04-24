---
title: Fathom-MCP
tags: [research, mcp, integration, security]
created: 2026-04-15
status: complete
---

# Fathom-MCP

## What It Is

Fathom-MCP is a lightweight, open-source TypeScript MCP (Model Context Protocol) server enabling LLM applications to access meeting recordings, transcripts, summaries, and analytics from Fathom.video. It bridges the Fathom.video meeting platform and AI systems via the MCP standard, allowing Claude, ChatGPT, Cursor, and other MCP-capable tools to query meeting data programmatically.

**Important:** Fathom-MCP is often marketed as "zero-configuration," but this is misleading. Setup requires: (1) generating a Fathom API key, (2) configuring environment variables or config files, (3) editing Claude Desktop's MCP configuration, and (4) implementing rate-limit handling for production. This is not a plug-and-play tool; plan for 2–4 hours of setup per deployment, plus ongoing maintenance.

## Key Concepts

- **MCP (Model Context Protocol):** Anthropic's November 2024 open standard for standardizing how LLM applications connect to external data sources, tools, and workflows. 97 million monthly SDK downloads, 10,000+ active servers, native support in Claude Desktop, ChatGPT Developer Mode, Cursor IDE, and other major AI platforms.
- **Fathom.video:** Market-leading AI meeting platform serving 300,000+ companies with automatic transcription, summarization, action item extraction, and a public REST API.
- **Fathom-MCP Tools:** List meetings, retrieve speaker-labeled transcripts with timestamps, access engagement analytics, create/delete webhooks, and perform full-text search across meeting content.
- **Self-Hosted Deployment:** Run fathom-mcp on your laptop or internal server. Requires an API key stored in local configuration; zero external service costs; full operational and compliance burden on end-user.
- **Managed MCP Platforms:** Third-party services (Truto, Composio, Datadog) host and manage MCP servers with built-in credential rotation, audit logging, and rate-limit handling. Higher recurring cost; distributed security responsibility.
- **Rate Limiting:** Fathom API enforces 60 requests/minute per account. A single meeting fetch requires 4+ API calls; concurrent agent usage exhausts quota quickly.
- **Credential Storage:** Current standard practice (88% of MCP servers) is storing long-lived API keys in plaintext in local config files or environment variables.

## Context

**Who uses Fathom-MCP:**
- Teams building AI systems that need to access meeting content (e.g., AI-powered action item extraction, meeting summarization, compliance review)
- Development teams using Claude Desktop with MCP-aware integrations
- Organizations evaluating MCP servers for internal data access

**When it matters:**
- When you want LLM access to meeting transcripts and analytics without building custom integrations
- When comparing MCP servers for meeting data (competitors: Otter.ai, Fireflies.ai, HappyScribe, Meeting BaaS)
- When deciding between self-hosted vs. managed MCP platforms

**Why now:**
- MCP ecosystem has matured (28% Fortune 500 adoption as of 2026)
- Fathom-MCP is discoverable through Cursor IDE, Glama, and multiple integration aggregators
- Meeting intelligence is high-value use case for LLMs; vendors are releasing competing servers

## Key Numbers / Stats

- **MCP SDK downloads:** 97 million monthly as of 2026 — [2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — **[HIGH]**
- **Active MCP servers:** 10,000+ in production — [MCP Ecosystem in 2026 analysis](https://effloow.com/articles/mcp-ecosystem-growth-100-million-installs-2026) — **[HIGH]**
- **Enterprise adoption:** 28% of Fortune 500 companies have deployed MCP servers — [2026 Enterprise Adoption article](https://www.cdata.com/blog/2026-year-enterprise-ready-mcp-adoption) — **[MEDIUM]**
- **Fathom.video user base:** 300,000+ companies — [Fathom.ai homepage](https://fathom.ai/) — **[HIGH]**
- **Fathom API rate limit:** 60 requests/minute per account — [Fathom API documentation](https://developers.fathom.ai/api-reference/) — **[HIGH]**
- **MCP servers with plaintext credentials:** 88% of 2,614 implementations — [Practical DevSecOps - MCP Security Vulnerabilities 2025-2026](https://www.practical-devsecops.com/mcp-security-vulnerabilities/) — **[HIGH]**
- **Fathom.video compliance:** HIPAA eligible, SOC 2 Type II certified, GDPR compliant (service-level only) — [Fathom Trust Center](https://trust.fathom.video) — **[HIGH]**

## Links

- [Fathom-MCP GitHub Repository](https://github.com/lukas-bekr/fathom-mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [Fathom.video API Documentation](https://developers.fathom.ai/api-reference/)
- [Fathom Trust Center](https://trust.fathom.video)
- [Glama MCP Server Directory](https://glama.ai/mcp/servers/@lukas-bekr/fathom-mcp)
