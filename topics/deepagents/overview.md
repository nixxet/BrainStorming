---
title: deepagents
tags: [research, evaluate, agents, langchain, autonomous-agents, ai-frameworks]
created: 2026-04-20
status: complete
published: 2026-04-20
---

# deepagents

## What It Is

deepagents is a production-ready, open-source agent harness built on LangChain and LangGraph. It packages four proven architectural patterns (planning, persistent context, sub-agent delegation, and long-term memory) as reusable middleware components for autonomous, long-running agents. The framework is explicitly inspired by and generalizes Claude Code's architectural patterns to work with any tool-calling LLM, not just Claude.

## Native Domain

- **Market:** AI agent infrastructure; LangChain ecosystem
- **Why this context matters:** deepagents was extracted from Claude Code's proven patterns in production. It assumes you're building multi-step autonomous agents, not simple chatbots or single-shot LLM calls.

## Generalizable Value

- **Reusable patterns:** Four architectural primitives (middleware composition, backend abstraction, progressive disclosure, state schema extension) transfer to other agent frameworks beyond LangChain/LangGraph.
- **Cross-domain relevance:** Any project building autonomous agents can adopt deepagents's planning, context management, and memory patterns without vendor lock-in to Claude.

## Key Concepts

- **Agent Harness:** Opinionated middleware layer that pre-builds architectural patterns for autonomous agents. Trades developer convenience and wall-clock latency for higher token consumption vs. LangGraph directly.
- **Planning via Task Decomposition:** `write_todos` task planning component enabling agents to break problems into steps.
- **Filesystem Abstraction:** Persistent context backed by pluggable storage (local, S3, composite) so agents maintain state across sessions.
- **Sub-Agent Spawning:** Built-in delegation pattern; agents can spawn child agents for isolated task execution.
- **LangGraph Store Integration:** Long-term memory backed by LangGraph's store mechanism, enabling agents to recall and learn from past interactions.
- **Progressive Disclosure:** Agent capabilities defined as core identity plus on-demand skills, reducing context bloat.
- **Middleware Composition:** Plugin architecture (AgentMiddleware inheritance) enabling custom behavior injection without framework rewrites.

## Context

- Who uses this: Teams building planning-heavy autonomous agents, coding assistants, or long-running workflows needing structured state management.
- When: When moving beyond single-shot LLM calls or hand-wired agent logic; when you want Claude Code–like architecture without vendor lock-in.
- Why: Reduces design burden; generalizes proven patterns; active maintenance signal (v0.4 Feb 2026, 21k stars Python, 1.1k TypeScript).

## Key Numbers / Stats

- **GitHub adoption:** 21,000 stars (Python), 1,100 stars (TypeScript), both showing active commits through April 19, 2026. [langchain-ai/deepagents](https://github.com/langchain-ai/deepagents) — **HIGH** confidence
- **Production readiness:** v0.4 released February 2026 with pluggable sandboxes, context compression, and Responses API integration. [LangChain Releases](https://github.com/langchain-ai/deepagents/releases) — **MEDIUM** confidence (LangChain-controlled source)
- **Token trade-off:** Estimates 20x higher token consumption vs. LangGraph for lower wall-clock latency and developer convenience. [Practitioner cost analysis (Medium, TLS-blocked)](https://medium.com) — **MEDIUM** confidence (single T3 source, full methodology unavailable)
- **Market context:** 97% of executives deployed agents in the past year; 40% of agent projects projected to fail by 2027. deepagents targets the production-readiness gap. [DataCamp, Joget, CIO.com analyst reports](https://www.datacamp.com) — **MEDIUM** confidence (general market data, not deepagents-specific)

## Positioning Matrix

| Factor | deepagents | LangGraph | CrewAI | AutoGen | |--------|-----------|-----------|--------|---------| | **Level of abstraction** | High (opinionated harness) | Low (low-level graph runtime) | Medium (role-based orchestration) | Medium (conversation-based) | | **Agent autonomy** | High (autonomous with structure) | Variable (user controls) | Low (role-constrained) | Low (role-constrained) | | **Developer convenience** | High (batteries included) | Low (build-your-own) | High (predefined orchestration) | Medium (protocol-based) | | **Token cost** | Higher (opinionated middleware overhead) | Lower (minimal abstraction) | Variable | Variable | | **Best for** | Autonomous planning agents | Custom control, cost optimization | Hierarchical teams | Multi-turn conversation |

## Links

- [Official deepagents GitHub (Python)](https://github.com/langchain-ai/deepagents)
- [deepagentsjs (TypeScript)](https://github.com/langchain-ai/deepagents)
- [LangChain deepagents docs](https://python.langchain.com/docs/langgraph/reference/prebuilt/)
- [LangChain v0.4 release notes](https://github.com/langchain-ai/deepagents/releases)
- [CLI documentation](https://langchain-ai.github.io/deepagents-cli/)
