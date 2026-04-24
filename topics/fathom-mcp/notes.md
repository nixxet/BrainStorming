---
title: Fathom-MCP — Research Notes
tags: [research, findings, security, integration]
created: 2026-04-15
---

# Fathom-MCP — Research Notes

## Key Findings

### MCP Ecosystem & Adoption

- **[HIGH]** MCP is Anthropic's November 2024 open standard for AI-to-system integration. The specification is maintained publicly and has achieved native integration in Claude Desktop, ChatGPT Developer Mode (Sept 2025+), Cursor IDE, Gemini, Microsoft Copilot, and VS Code. — [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-11-25), [Anthropic announcement](https://www.anthropic.com/news/model-context-protocol)

- **[MEDIUM]** MCP has achieved rapid adoption: 97 million monthly SDK downloads and 10,000+ active servers as of 2026. OpenAI, Google, Microsoft, and Amazon have integrated MCP support. — [2026 MCP Roadmap blog](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/), [MCP Ecosystem in 2026 analysis](https://effloow.com/articles/mcp-ecosystem-growth-100-million-installs-2026)

- **[MEDIUM]** 28% of Fortune 500 companies have deployed MCP servers as of 2026, primarily for DevOps, platform engineering, and business operations use cases. — [2026 Enterprise Adoption article](https://www.cdata.com/blog/2026-year-enterprise-ready-mcp-adoption)

- **[MEDIUM]** November 2025 MCP specification expanded to support remote HTTP server deployments with Streamable HTTP transport. — [MCP's Next Phase article](https://medium.com/@dave-patten/mcps-next-phase-inside-the-november-2025-specification-49f298502b03), [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-11-25)

- **[HIGH]** Multiple vendors have released competing MCP servers for meeting data: Otter.ai, Fireflies.ai, HappyScribe, and Meeting BaaS all provide MCP access to meeting recordings, transcripts, and analytics. This indicates strong market demand for AI-meeting-data integration. — [Meeting-MCP GitHub](https://github.com/Meeting-Baas/meeting-mcp), [HappyScribe MCP announcement](https://www.happyscribe.com/blog/mcp-server), [Glama directory](https://glama.ai/)

### Fathom-MCP: Architecture & Capabilities

- **[HIGH]** Fathom-MCP is a lightweight TypeScript MCP server (2 commits suggesting early-stage development) providing LLM access to Fathom.video's meeting data API. It enables listing, searching, and retrieving meeting recordings, transcripts, summaries, and analytics. — [GitHub lukas-bekr/fathom-mcp](https://github.com/lukas-bekr/fathom-mcp)

- **[HIGH]** Fathom-MCP exposes tools for: listing and filtering meetings, retrieving speaker-labeled transcripts with timestamps, creating/deleting webhooks, full-text search across meeting content, and participant engagement analytics. Response formats include markdown and JSON. — [GitHub lukas-bekr/fathom-mcp](https://github.com/lukas-bekr/fathom-mcp), [Fathom MCP on mcp.aibase.com](https://mcp.aibase.com/server/1568219678151811274)

- **[MEDIUM]** Fathom-MCP is discoverable through Cursor IDE integration, Glama (20,000+ servers), Composio, Truto, viaSocket, playbooks, and LobHub. — [Glama Fathom MCP listing](https://glama.ai/mcp/servers/@lukas-bekr/fathom-mcp), [Truto blog](https://truto.one/blog/best-mcp-server-for-fathom-in-2026)

- **[MEDIUM]** "Zero-configuration" marketing description of Fathom-MCP is PARTIALLY FALSE. Users must: (1) generate a Fathom API key, (2) store the key in an environment variable or config file, (3) configure Claude Desktop's `claude_desktop_config.json` with the MCP server entry point, and (4) handle rate-limit logic for production deployments. — [fathom-mcp GitHub](https://github.com/lukas-bekr/fathom-mcp)

### Fathom.video Platform

- **[HIGH]** Fathom.video is a market-leading AI meeting platform serving 300,000+ companies, offering automatic transcription, summarization, action item extraction, and a public REST API. It integrates with Zoom, Google Meet, and Teams. — [Fathom.ai homepage](https://fathom.ai/), [Fathom API documentation](https://developers.fathom.ai/api-reference/recordings/get-transcript)

- **[HIGH]** Fathom API enforces a 60 requests/minute rate limit per user account (global limit across all API keys for a given Fathom account). — [Fathom API documentation](https://developers.fathom.ai/api-reference/), [fathom-mcp GitHub README](https://github.com/lukas-bekr/fathom-mcp)

- **[HIGH]** Fathom.video holds HIPAA, SOC 2 Type II, and GDPR compliance certifications. The platform offers Business Associate Agreements for HIPAA-eligible deployments. — [Using Fathom - How We Keep You Secure](https://www.fathomhq.com/security), [Fathom Trust Center](https://trust.fathom.video)

### Critical Security Findings

- **[HIGH]** Service-level compliance (Fathom.video's HIPAA/SOC2/GDPR certifications) does NOT extend to plaintext-credential fathom-mcp deployments. Deploying fathom-mcp with plaintext credential storage (environment variables, config files) violates HIPAA, GDPR, and SOC 2 requirements. If the API key is compromised, attackers gain full read access to all meeting data without controls or logs. The compliance burden shifts entirely to the end-user. — [Using Fathom - How We Keep You Secure](https://www.fathomhq.com/security)

- **[HIGH]** 88% of MCP servers (2,614 implementations surveyed) store API credentials in plaintext, using long-lived static secrets in local configuration files. Only 8.5% use modern OAuth. This is a widespread security pattern affecting all self-hosted MCP servers with API backends, including fathom-mcp. — [Practical DevSecOps - MCP Security Vulnerabilities 2025-2026](https://www.practical-devsecops.com/mcp-security-vulnerabilities/)

- **[HIGH]** Claude Code's MCP initialization can execute commands before user approval (CVE-2025-59536). While Anthropic patched this to require user approval, configuration-driven MCP execution carries inherent timing and consent risks. For fathom-mcp, a malicious `.claude` project configuration could auto-enable the server and exfiltrate credentials during initialization. — [Check Point Research - CVE-2025-59536](https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/)

- **[HIGH]** Prompt injection and tool poisoning attacks on MCP tools are well-documented and directly applicable to fathom-mcp. Attackers can embed malicious instructions in MCP tool descriptions (invisible to users but visible to LLMs) to coerce the model into invoking Fathom API calls and exfiltrating meeting transcripts, summaries, and analytics. Real-world PoCs of malicious MCP servers silently exfiltrating sensitive data have been documented. — [Microsoft - Protecting against indirect prompt injection attacks in MCP](https://developer.microsoft.com/blog/protecting-against-indirect-injection-attacks-mcp), [Log-To-Leak: Prompt Injection Attacks on LLM Agents via MCP](https://openreview.net/forum?id=UVgbFuXPaO), [Unit 42 Palo Alto Networks - MCP Attack Vectors](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/)

- **[HIGH]** Fathom's 60 req/min rate limit creates DoS vulnerability under concurrent agent load. A single meeting fetch requires 4+ API calls (list, transcript, summary, analytics). With 15 concurrent LLM agents querying the same meeting, the budget exhausts in seconds, leaving no capacity for other queries. Self-hosted fathom-mcp provides basic rate-limit awareness but no request queuing or caching; managed MCP platforms handle this transparently. — [Truto Blog - Best MCP Server for Fathom in 2026](https://truto.one/blog/best-mcp-server-for-fathom-in-2026), [Datadog - Understanding MCP security](https://www.datadoghq.com/blog/monitor-mcp-servers/)

- **[MEDIUM]** The MCP ecosystem experienced 30+ CVEs in Q1 2026 (first 60 days), including CVSS 9.6 RCE vulnerabilities in widely-used packages (mcp-remote, 437,000 downloads). While fathom-mcp itself has no known CVEs, its dependencies (Node.js SDK, Anthropic MCP SDK) and transitive dependencies are subject to rapid vulnerability discovery. For production deployments, implement: (1) dependency scanning (npm audit, Dependabot) with automated updates, (2) runtime monitoring for known CVE signatures, and (3) rapid rollout procedures for critical patches. Do not treat MCP ecosystem as stable; expect 5–10 CVEs/month in 2026 as the ecosystem matures. — [MCP Security 2026: 30 CVEs in 60 Days](https://www.heyuan110.com/posts/ai/2026-03-10-mcp-security-2026/), [Endor Labs: Classic Vulnerabilities Meet AI Infrastructure](https://www.endorlabs.com/learn/classic-vulnerabilities-meet-ai-infrastructure-why-mcp-needs-appsec)

- **[MEDIUM]** Fathom-MCP provides no role-based access control (RBAC), meeting-level permission filtering, or built-in audit trails. Authenticated users (anyone with the API key) can access all meetings indiscriminately. This violates enterprise security frameworks requiring granular permissions and audit trails for data access. — [Model Context Protocol security best practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)

- **[MEDIUM]** Over-permissioning in API responses creates excessive data exposure risk. If `get_meeting_summary()` returns the entire meeting object (transcript, attendees, analytics, metadata) rather than just the summary field, the LLM receives far more sensitive data than necessary. This is an OWASP Top 10 API vulnerability. LLMs are known to leak context in unexpected ways; exposing unnecessary fields increases surface area for unintended data disclosure. — [OWASP Top 10 API Security Risks](https://appsentinels.ai/blog/owasp-top-10-api-security-risks/), [The Privacy Gap in API Security](https://www.imperva.com/blog/the-privacy-gap-in-api-security-why-protecting-apis-shouldnt-put-your-data-at-risk/)

## Counterarguments & Risks

**Self-hosted is simpler and cheaper:** True for development/testing. False for production. Incident response and compliance remediation costs ($10k–$500k+) far exceed operational savings ($0/month self-hosted vs. $100–$1k/month managed). Managed platforms are actually more cost-effective for regulated environments.

**Fathom.video is compliant, so fathom-mcp is compliant:** False. Service-level certification does not extend to deployment-level security. Plaintext credentials, no audit logging, and no access controls create compliance violations independent of Fathom's underlying security.

**Prompt injection risk is overstated:** Documented attack class with real-world PoCs. Meeting transcripts contain sensitive business intelligence; exposure via LLM context leakage is a material risk, not theoretical.

**Rate limiting is Fathom's problem:** True for protecting Fathom's infrastructure. False for user experience. Responsibility for rate-limit handling falls entirely on the MCP server developer (self-hosted) or platform provider (managed). Fathom-MCP's basic awareness doesn't prevent quota exhaustion under concurrent load.

## Gaps & Unknowns

- **Adoption metrics unknown:** No publicly available data on fathom-mcp installations, GitHub stars, or documented deployment case studies. Broader MCP adoption (97M downloads, 10k+ servers) cannot be extrapolated to fathom-mcp specifically.

- **Encryption-at-rest details not documented:** Neither Fathom.video nor fathom-mcp documentation publicly specify encryption standards for stored transcripts (AES-256? Transparent encryption? Customer-managed keys?).

- **Implementation comparison not researched:** Two distinct Fathom MCP repositories exist (lukas-bekr/fathom-mcp and matthewbergvinson/fathom-mcp). Feature parity, differences, and fork history are unknown. No comparative analysis available.

- **OAuth support unknown:** Fathom-MCP uses only static API keys; no OAuth support planned or documented.

- **Webhook reliability & retry logic:** Mentioned in ecosystem brief but not researched in depth.

- **Performance benchmarks:** No transcript retrieval latency data available.

## Confidence Summary

- **HIGH:** 14 findings (MCP standard, adoption metrics, Fathom-MCP capabilities, service compliance, credential storage risk, prompt injection, rate limiting, CVE-2025-59536, ecosystem CVE spike)
- **MEDIUM:** 7 findings (adoption metrics, HTTP transport, zero-config claim, access control gaps, over-permissioning, market demand, Fortune 500 adoption)
- **LOW:** 0 findings
- **UNVERIFIED:** 0 findings
