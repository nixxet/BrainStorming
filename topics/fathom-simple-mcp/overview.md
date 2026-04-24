---
title: Fathom-Simple-MCP
tags: [research, tools, mcp]
created: 2026-04-15
status: complete
source: https://github.com/druellan/Fathom-Simple-MCP
---

# Fathom-Simple-MCP

## What It Is

Fathom-Simple-MCP is a lightweight, read-only Python MCP server that connects AI assistants to Fathom.video's meeting intelligence data. It uses FastMCP (the dominant Python MCP framework) and defaults to TOON (Token-Optimized Object Notation) output formatting, which filters null and empty fields to reduce LLM token consumption by 30–60% compared to JSON. The server exposes search, list, and retrieval operations for meetings, transcripts, summaries, teams, and team members—all without write access to the underlying Fathom API.

## Key Concepts

- **MCP (Model Context Protocol):** Open-source standard adopted by Anthropic, OpenAI, Google, and major platforms. Enables AI agents to securely query external data sources. 10,000+ active public servers exist (12,000+ total).
- **FastMCP:** Python framework powering ~70% of MCP servers. Release 3.0 (January 2026) achieves 1M+ daily downloads. Has 3 documented CVEs in 2025–2026 (CVE-2025-53366, CVE-2025-69196, CVE-2025-62801). Pin to a patched version; verify `pip show fastmcp` reports a release after June 2025.
- **TOON Format:** Proprietary output format that removes empty/null fields, achieving 27.7–76.4% token efficiency gains over standard JSON depending on data structure uniformity.
- **Fathom API Rate Limit:** 60 requests per minute per user (user-level, not key-level). No paid tier offers higher limits as of April 2026. This is a shared pool across all API keys created by a single user.
- **Lazy-Loading Tool Discovery:** Claude Code connects to MCP servers via on-demand tool search instead of upfront definition loading, achieving 85–95% context reduction vs. clients that load all definitions immediately.
- **Bus Factor:** Community project with single maintainer (GitHub: 2 stars, 1 fork, 1 active contributor). No corporate backing.
- **Read-Only Access:** Fathom API exposes no write operations; users cannot create, edit, or delete meetings via MCP.

## Context

Fathom-Simple-MCP targets solo developers and internal prototyping workflows in IDEs like Claude Code, Cursor, and Windsurf. The AI meeting-intelligence market (Fathom, Fireflies.ai, Otter.ai) is growing from $2.44B (2024) to projected $15.16B (2032). Open-source Fathom MCP implementations address the gap between free local setup and managed SaaS solutions; at least seven independent implementations exist, each optimizing for different trade-offs (token efficiency, security, compliance, IDE integration).

**Real-world use cases:** Automated CRM synchronization where agents monitor transcripts and update Salesforce/HubSpot; agentic CRM workflows in GoHighLevel; direct Fathom-to-Claude pipelines for meeting analysis.

## Key Numbers / Stats

- **TOON token reduction:** 27.7–76.4% efficiency gain vs. JSON depending on data structure. **[HIGH confidence]** — [LogRocket TOON benchmark](https://blog.logrocket.com/reduce-tokens-with-toon/)
- **Fathom API rate limit:** 60 requests per minute per user; 10 burst RPS. **[HIGH confidence]** — [Fathom API Limits](https://api-docs.fathom.global/limits.html)
- **FastMCP dominance:** ~70% of active MCP servers use FastMCP. **[HIGH confidence]** — [FastMCP 3.0 Review](https://www.automateed.com/fastmcp-3-0-review)
- **Claude Code context reduction:** 85–95% reduction with lazy-loading tool discovery. **[HIGH confidence]** — [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp)
- **AI meeting-intelligence market:** $2.44B (2024) → $15.16B (2032). **[HIGH confidence]** — [Neuronad: Fireflies vs Otter](https://neuronad.com/fireflies-vs-otter/)
- **MCP ecosystem adoption:** 250+ vendor-verified servers, 12,000+ total across platforms; Slack reports 25x increase in MCP tool calls in enterprise deployments (2026). **[HIGH confidence]** — [Slack MCP Blog](https://slack.com/blog/news/powering-agentic-collaboration)
- **Fathom-Simple-MCP adoption:** 2 GitHub stars, 1 fork, 23 commits, single maintainer. **[HIGH confidence]** — [GitHub: druellan/Fathom-Simple-MCP](https://github.com/druellan/Fathom-Simple-MCP)

## Example Configuration

> ⚠️ **CRITICAL Security Warning:** The `FATHOM_API_KEY` environment variable is a static, long-lived secret. On shared systems or containers, it can be read via process inspection (`/proc/{pid}/environ` on Linux, `Get-ChildItem Env:` on Windows). For solo local development only—do not deploy on shared infrastructure without migrating to OS Keychain (macOS: `security add-generic-password`), Windows Credential Manager, or a secrets manager like HashiCorp Vault or AWS Secrets Manager. On shared systems, this is a CRITICAL security vulnerability (GDPR/HIPAA breach risk: $50K–$500K cost).

To connect Fathom-Simple-MCP to Claude Code, add this to your `.mcp.json`:

```json
{
  "mcpServers": {
    "fathom": {
      "command": "uv",
      "args": ["run", "--with", "fastmcp", "fathom_mcp.py"],
      "env": {
        "FATHOM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Requires runtime validation: verify `FATHOM_API_KEY` is never committed to version control or logged.

Or run locally via stdio transport:

```bash
export FATHOM_API_KEY="your-api-key-here"
python fathom_mcp.py
```

## Links

- [GitHub: druellan/Fathom-Simple-MCP](https://github.com/druellan/Fathom-Simple-MCP)
- [Fathom API Documentation](https://help.fathom.video/en/articles/8368641)
- [Model Context Protocol Official Docs](https://modelcontextprotocol.io/docs/getting-started/intro)
- [FastMCP Framework](https://gofastmcp.com/)
- [Claude Code MCP Integration Guide](https://code.claude.com/docs/en/mcp)
- [Best MCP Servers for Fathom (2026) - Truto](https://truto.one/blog/best-mcp-server-for-fathom-in-2026)
