---
title: Claude-Mem
tags: [research, tools, persistent-memory, ai-coding-assistants]
created: 2026-04-14
updated: 2026-04-17
status: published
published: 2026-04-17
quality_score: 8.79
---

# Claude-Mem

## What It Is

Claude-Mem is a persistent-memory plugin for Claude Code and related coding-agent environments. It captures session activity through hook scripts, stores compressed observations in a local worker-backed memory system, and exposes retrieval through MCP search tools plus a local web viewer on `127.0.0.1:37777`. The product is real, featureful, and shipping quickly; the main question is not whether it works at all, but whether its current security and operational tradeoffs are acceptable.

## Key Concepts

- **Hook-driven capture:** Session activity is collected through lifecycle hooks and routed into a background worker and storage pipeline. [README](https://github.com/thedotmack/claude-mem) [Architecture overview](https://docs.claude-mem.ai/architecture/overview)
- **Local worker service:** The worker exposes an HTTP API and web viewer on port `37777`, managed separately from the MCP server. [README](https://github.com/thedotmack/claude-mem) [Worker service docs](https://docs.claude-mem.ai/architecture/worker-service)
- **MCP retrieval workflow:** Claude-Mem documents a progressive search flow built around MCP tools and staged retrieval rather than dumping raw history into context. [README](https://github.com/thedotmack/claude-mem) [Context engineering docs](https://docs.claude-mem.ai/context-engineering)
- **Operational stack depth:** Current main depends on Node.js plus Bun, and can also use `uv`/Chroma for vector search paths. That is more infrastructure than a plain `CLAUDE.md` workflow. [README](https://github.com/thedotmack/claude-mem)
- **Mixed licensing:** The root project is AGPL-3.0, while `ragtime/` is separately licensed under PolyForm Noncommercial 1.0.0. [LICENSE](https://github.com/thedotmack/claude-mem/blob/main/LICENSE) [ragtime/LICENSE](https://github.com/thedotmack/claude-mem/blob/main/ragtime/LICENSE)

## Context

- **Best fit:** Solo developers running long-lived, non-sensitive projects who specifically want semantic or timeline-style memory retrieval.
- **Poor fit:** Shared machines, sensitive codebases, compliance-heavy environments, or teams expecting a hardened local service by default.
- **Decision lens for this re-evaluation:** Fresh primary-source verification of current `main`, current releases, and current issue states as of April 17, 2026 Central Time / April 18, 2026 UTC on GitHub.

## Key Numbers / Stats

- **61,558 GitHub stars / 5,105 forks / 95 contributors** on the current repo snapshot. [GitHub repo](https://github.com/thedotmack/claude-mem)
- **Latest release:** `v12.2.0`, published on **2026-04-18 UTC** (the evening of **2026-04-17** in U.S. Central time). [Release v12.2.0](https://github.com/thedotmack/claude-mem/releases/tag/v12.2.0)
- **Rapid release cadence:** `v12.1.3`, `v12.1.4`, `v12.1.5`, `v12.1.6`, and `v12.2.0` all landed between April 15 and April 18 UTC. [Releases](https://github.com/thedotmack/claude-mem/releases)
- **Default local worker surface:** `127.0.0.1:37777`, with settings support for alternative hosts including `0.0.0.0`. [Settings defaults](https://github.com/thedotmack/claude-mem/blob/main/src/shared/SettingsDefaultsManager.ts) [Settings routes](https://github.com/thedotmack/claude-mem/blob/main/src/services/worker/http/routes/SettingsRoutes.ts)
- **Open consolidated security tickets:** `#1932` through `#1936` remain open after the April backlog cleanup. [#1932](https://github.com/thedotmack/claude-mem/issues/1932) [#1933](https://github.com/thedotmack/claude-mem/issues/1933) [#1934](https://github.com/thedotmack/claude-mem/issues/1934) [#1935](https://github.com/thedotmack/claude-mem/issues/1935) [#1936](https://github.com/thedotmack/claude-mem/issues/1936)

## Links

- [GitHub repository](https://github.com/thedotmack/claude-mem)
- [Official docs](https://docs.claude-mem.ai/)
- [Release v12.2.0](https://github.com/thedotmack/claude-mem/releases/tag/v12.2.0)
- [Release v12.1.6](https://github.com/thedotmack/claude-mem/releases/tag/v12.1.6)
- [Security consolidation issue #1933](https://github.com/thedotmack/claude-mem/issues/1933)
- [Windows deadlock canonical issue #1887](https://github.com/thedotmack/claude-mem/issues/1887)
