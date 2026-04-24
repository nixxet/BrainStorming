---
title: OpenClaude
tags: [research, multi-provider, claude-code, architecture]
created: 2026-04-03
updated: 2026-04-06
status: complete
---

# OpenClaude

## What It Is

OpenClaude is a rapidly growing, actively maintained fork of the March 2026 Claude Code source leak that replaces Anthropic's proprietary API backend with an OpenAI-compatible provider shim. It enables routing to 200+ third-party LLM providers (OpenAI, DeepSeek, Gemini, Groq, Together, Ollama, LM Studio) while preserving Claude Code's core tools (bash, file operations, grep/glob, vision, MCP, streaming). Built with Bun runtime for fast CLI startup. Minimal codebase (786 lines) adds zero new npm dependencies. As of April 6, 2026, it has 17.6k GitHub stars (up 82% from 9.6k on April 3) and demonstrates active maintenance with 348 commits and ongoing feature development (gRPC server support, agent routing, VS Code extension).

## Key Concepts

- **OpenAI-Compatible Shim:** Intercepts Claude SDK requests and translates them to OpenAI API format, enabling provider routing.
- **Provider Routing:** Can dispatch requests to any OpenAI-compatible API; however, only ~10 providers support full agent workflows (tools, streaming, context windows). Most others support basic text completion only.
- **Feature Preservation:** Claude Code's tool definitions (bash, file I/O, glob/grep, vision, MCP, streaming) are copied verbatim to the fork. Feature parity claim is TRUE for tool definitions but MISLEADING for provider compatibility.
- **Abstraction Leakage:** Anthropic-specific API fields (e.g., `anti_distillation`, REPL session flags) are sent to third-party providers that don't recognize them, causing silent failures or request rejection on non-Anthropic models. Issues #267, #248 remain unresolved as of April 6.
- **Local Model Support:** Can run on-device via Ollama or LM Studio, eliminating cloud API costs. Limited to simple file I/O; cannot sustain multi-step agent workflows (fails at 10+ tool calls).
- **Bun Runtime:** Provides 14x faster CLI startup than Node.js and 13.4x faster MCP cold start (95ms vs 1,270ms).
- **API Key Storage:** Two options: environment variables (recommended) or `~/.claude/settings.json` in plaintext (with warning). **No SecretRef system** — that feature belongs to OpenClaw (separate fork). Work deployments require centralized secret management.
- **Known CVEs:** Bun CVE-2026-24910 (requires >= 1.3.5); MCP CVE-2025-6514 (mcp-remote middleware, 437k+ affected instances, patched in 0.1.16).
- **Security Vulnerability (Source Inheritance):** Adversa AI disclosed permission system bypass via prompt injection in Claude Code source (March 2026); OpenClaude inherits this vulnerability. Unresolved as of April 6.
- **I/O Stability Issues:** Windows/macOS input hangs (Issues #228, #220) documented; PR #266 fix merged to main but NOT in npm release as of April 6. Blocks team deployment on Windows/macOS.

## Context

- **Who:** Researchers and builders seeking transparent, multi-provider Claude Code alternatives; cost-optimization projects; privacy-sensitive workflows.
- **When:** For simple file analysis, ticket classification, or cost-constrained environments. NOT for production agentic triage, multi-provider multi-step workflows, or high-security IT support contexts.
- **Why it matters:** The Claude Code source leak created a moment for exploring open-source alternatives. OpenClaude is the most minimal fork (minimal code change, zero dependencies) with rapid adoption growth (9.6k→17.6k stars in 3 days). Understanding its architecture, unresolved issues (I/O hangs, abstraction leakage, safety vulnerabilities), and trade-offs informs decisions on whether to use native Claude Code, optimize cost via cheaper closed-source models, or adopt alternative open-source tools.
- **Ecosystem context:** Three-way split in multi-provider CLI market as of April 2026: OpenCode (112k stars, SST team, maximum flexibility), Cline (112k stars, VS Code–native, AGPL-3.0), OpenClaude (17.6k stars, minimal fork, rapidly growing, but unresolved critical issues).

## Key Numbers / Stats

- **GitHub Stars:** 17.6k (±0.5k variance, April 6, 2026) — UP from 9.6k on April 3 (82% growth in 3 days) [GitHub - Gitlawb/openclaude](https://github.com/Gitlawb/openclaude) — HIGH confidence
- **Codebase Size:** 786 lines (src/services/api/openaiShim.ts, src/utils/model/, auth utilities) [GitHub - Gitlawb/openclaude](https://github.com/Gitlawb/openclaude) — HIGH confidence
- **Active Maintenance:** 348 commits, 49 open issues, 27 pull requests, April 5-6 activity confirmed. VS Code extension PR #172 merged April 2, 2026. [GitHub - Gitlawb/openclaude](https://github.com/Gitlawb/openclaude) — HIGH confidence
- **Local Model Capability:** Llama 2 13B, Mistral 7B reach ~45% on SWE-Bench (vs Claude Opus 80.8%, Claude Sonnet 79.6%); fail at 10+ tool calls [notes, verified findings] — HIGH confidence
- **Bun Startup Performance:** 14x faster CLI startup than Node.js; 13.4x faster MCP cold start (95ms vs 1,270ms) [MintMCP: Bun with MCP performance guide](https://www.mintmcp.com/blog/bun-with-mcp) — HIGH confidence
- **I/O Stability Blockers:** Windows input hang (Issue #228), macOS input hang (Issue #220). PR #266 fix merged to main but NOT in npm as of April 6. [GitHub - Gitlawb/openclaude issues](https://github.com/Gitlawb/openclaude/issues) — HIGH confidence (blocker unresolved)
- **Abstraction Leakage Issues:** Issues #267, #248 unresolved as of April 6. Breaks multi-provider compatibility on non-Anthropic models. [GitHub - Gitlawb/openclaude issues](https://github.com/Gitlawb/openclaude/issues) — MEDIUM confidence (status unconfirmed)
- **Security Vulnerability (Inherited):** Adversa AI disclosed permission system bypass via prompt injection in Claude Code source (March 2026). All forks, including OpenClaude, inherit this unresolved vulnerability. [SecurityWeek: Critical Vulnerability](https://www.securityweek.com/critical-vulnerability-in-claude-code-emerges-days-after-source-leak/) — HIGH confidence

## Links

- [GitHub - Gitlawb/openclaude](https://github.com/Gitlawb/openclaude) — Official repository
- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — MCP integration standard
- [OpenRouter Docs: Claude Code Integration](https://openrouter.ai/docs/guides/coding-agents/claude-code-integration) — Provider compatibility guidance
- [Bun Runtime](https://bun.sh/) — Official Bun documentation
- [SecurityWeek: Critical Vulnerability in Claude Code](https://www.securityweek.com/critical-vulnerability-in-claude-code-emerges-days-after-source-leak/) — Adversa AI security research (permission system bypass)
- [JFrog Security Blog - CVE-2025-6514](https://jfrog.com/blog/2025-6514-critical-mcp-remote-rce-vulnerability/) — mcp-remote RCE vulnerability details
