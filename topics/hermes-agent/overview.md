---
title: Hermes Agent (NousResearch)
topic_slug: hermes-agent
tags: [research, agent-runtime, nousresearch]
source_url: https://github.com/NousResearch/hermes-agent
category: personal-agent-runtime
status: complete
created: 2026-04-17
---

# Hermes Agent (NousResearch)

## What It Is

Hermes Agent is an open-source, MIT-licensed personal agent runtime from NousResearch, launched February 2026 as the direct successor to OpenClaw. Its defining characteristic is a closed self-improvement loop: after complex interactions the agent autonomously generates Python skill files, updates persistent markdown memory, and optionally produces RL training trajectories via Atropos/GRPO. It is a personal agent runtime, not an enterprise orchestration framework — it is absent from every major 2026 enterprise-framework comparison.

## Key Stats

- **GitHub stars:** 97,100 (April 16, 2026)
- **Prior milestone:** ~69,900 stars within first two months of Feb 2026 launch
- **Open issues:** 1,900+
- **Open PRs:** 3,400+
- **Launch date:** February 2026
- **Latest version:** v0.10.0 (April 16, 2026)
- **License:** MIT
- **Maintainer:** NousResearch (Paradigm VC-led ~$65M Series A funding)
- **Migration path:** `hermes claw migrate` from OpenClaw

## Architecture at a Glance

- Three-layer memory: `MEMORY.md` / `USER.md` markdown files + SQLite FTS5 session history + 8 optional external provider plugins
- 47-tool built-in registry with configurable toolsets and per-platform activation
- Six execution backends: local, Docker, SSH, Singularity, Modal, Daytona
- Model-agnostic via ChatML function-calling standard (200+ providers)
- Self-improvement loop: skill creation after 5+ tool calls, progressive disclosure on reuse
- ACP editor protocol (JSON-RPC 2.0 over stdio) for VS Code, Zed, JetBrains, Neovim
- Atropos RL training pipeline (GRPO + LoRA) for trajectory-based model fine-tuning

## Tool System

- **47 built-in tools** across filesystem, shell, web, media, dialogue, and delegation categories
- **MCP server integration** with filtering and safety gating
- **Configurable toolsets** — per-platform activation (CLI, Telegram, Discord, Slack)
- **`delegate_task` subagent spawning** for task decomposition
- **Tool Gateway** (Firecrawl web search, FAL/FLUX 2 image gen, OpenAI TTS, Browser Use) — moved behind Nous Portal paid subscription in v0.10.0

## Memory System

- **`MEMORY.md`** — 2,200-char agent working memory (~800 tokens)
- **`USER.md`** — 1,375-char user profile (~500 tokens)
- **SQLite FTS5** — full-text-searchable session history
- **8 external providers** — Honcho (dialectic user modeling), Mem0, Zep, Letta, Supermemory, and others
- Character caps force severe compression at scale

## Execution Backends

- **Local** — direct shell execution (no containment by default)
- **Docker** — containerized
- **SSH** — remote host execution
- **Singularity** — HPC container
- **Modal** — serverless with hibernation
- **Daytona** — dev environment sandbox

## Model Support

- **Model-agnostic** via Hermes ChatML + `<tool_call>` XML special-token standard with JSON name/arguments schema
- **Hermes 4 family** — 14B / 70B / 405B hybrid reasoning models with `<think>` tags, trained on 5.1M samples using 192 NVIDIA B200 GPUs
- **200+ providers** at the model layer (OpenAI, Anthropic, DeepSeek, local vLLM/SGLang/Ollama, etc.)

## AgentSkills.io Compatibility

- Implements the **SKILL.md open standard** from agentskills.io
- **30+ adopters** include Claude Code, GitHub Copilot, Cursor, Gemini CLI
- Cross-agent skill portability claimed; exact native-vs-conversion mechanism not fully confirmed in primary Hermes docs

## Self-Improvement Loop

- Skill creation trigger: 5+ tool calls in a session
- **Progressive disclosure** — skill metadata preview (~3K tokens) loaded before full skill content
- Skills injected into future sessions automatically
- Optional RL path: Atropos trajectory collection → GRPO training with LoRA adapters → WandB logging → fine-tuned Hermes model
- Learning is **off by default**

## Competitive Position

- **Category:** Personal agent runtime — alongside OpenClaw (predecessor), AutoGPT-style agents, local assistants
- **Not in the same category as:** LangGraph, CrewAI, AutoGen, Smolagents, OpenAI Agents SDK (enterprise/developer orchestration frameworks)
- **vs OpenClaw:** direct successor; `hermes claw migrate` provides upgrade path; OpenClaw had 9 CVEs in 4 days — Hermes has no formal CVEs but 4 Critical + 9 High open findings in Issue #7826
- **Absence from MorphLLM 8-framework comparison is categorical, not an oversight**

## Links

- [GitHub](https://github.com/NousResearch/hermes-agent)
- [Documentation](https://hermes-agent.nousresearch.com/docs/)
- [Hermes 4 Technical Report (arXiv)](https://arxiv.org/abs/2508.18255)
- [AgentSkills.io](https://agentskills.io/home)
- [Issue #7826 — Security Audit](https://github.com/NousResearch/hermes-agent/issues/7826)
- [Issue #3968 — Cron Injection](https://github.com/NousResearch/hermes-agent/issues/3968)
- [Issue #5563 — State.db Corruption](https://github.com/NousResearch/hermes-agent/issues/5563)
