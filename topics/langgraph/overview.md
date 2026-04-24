---
title: LangGraph
tags: [research, framework, llm, agents]
created: 2026-04-20
status: complete
---

# LangGraph

## What It Is

LangGraph is LangChain's low-level orchestration framework and runtime for building long-running, stateful agents as graphs. It models work as shared state plus nodes and edges, and its core differentiators are checkpointed execution, human-in-the-loop interrupts, replay/time travel, and explicit control over workflow structure.

LangGraph can be used standalone or underneath LangChain. LangChain's `create_agent` API runs on top of LangGraph, so the practical choice is often: start higher-level with LangChain, then drop into raw LangGraph only when you need custom orchestration.

## Source Domain

- **Native context:** Python and JavaScript agent orchestration for LLM applications that need persistence, branching, approvals, retries, or multi-step state transitions.
- **Why that context matters:** LangGraph's main value is not prompt templating or provider abstraction. Its value is runtime control: checkpoints, threads, stores, interrupts, and replay.

## Generalizable Value

- **Reusable pattern:** state-machine-as-graph orchestration for long-running workflows.
- **Reusable pattern:** separate short-lived execution state from cross-session memory via checkpointers and stores.
- **Reusable pattern:** deterministic replay discipline, where side effects are wrapped so recovery does not duplicate external actions.

## Key Concepts

- **`StateGraph`:** the graph builder for shared state, nodes, and edges.
- **Nodes and edges:** nodes perform work; edges define sequential, conditional, or parallel routing.
- **Threads and checkpoints:** execution history is persisted under a `thread_id`; checkpoints are saved at super-step boundaries.
- **Interrupts:** execution can pause, persist state, and wait for human input before resuming.
- **Store vs. checkpointer:** the checkpointer persists per-thread execution state; the store handles cross-thread memory.
- **Durability modes:** `exit`, `async`, and `sync` trade off performance against checkpoint safety.
- **Agent Server / CLI:** LangGraph includes local development and deployment workflows beyond the core OSS library.

## Context

- Best when a workflow genuinely needs pause/resume, human approval, branching, replay, or stateful multi-step execution.
- Less compelling when a simple tool-calling loop or single LLM request is enough.
- Most useful for teams willing to treat orchestration as infrastructure rather than helper glue code.

## Key Numbers / Stats

- GitHub repo snapshot on 2026-04-20: **29.7k stars**, **5.1k forks**, **502 releases** — **[HIGH]** confidence from the official repo page.
- Latest GitHub release visible on 2026-04-20: **`langgraph==1.1.8` on April 17, 2026** — **[HIGH]** confidence from the official releases page.
- Stack Overflow 2025 Developer Survey: **16.2%** of developers actively building agents reported using LangGraph; the orchestration-tools question had **3,758 responses** — **[HIGH]** confidence.
- The repo security page currently lists **5 published advisories**: 3 high-severity advisories in October-December 2025 and 2 moderate advisories in February-March 2026 — **[HIGH]** confidence.

## Sources

- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
- [LangGraph Releases](https://github.com/langchain-ai/langgraph/releases)
- [LangGraph v1 Release Notes](https://docs.langchain.com/oss/python/releases/langgraph-v1)
- [LangGraph Durable Execution Docs](https://docs.langchain.com/oss/python/langgraph/durable-execution)
- [LangGraph Persistence Docs](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph Human-in-the-Loop Docs](https://docs.langchain.com/oss/python/langgraph/human-in-the-loop)
- [LangGraph Data Storage and Privacy](https://docs.langchain.com/langsmith/data-storage-and-privacy)
- [LangGraph JS Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [LangGraph Case Studies](https://docs.langchain.com/oss/python/langgraph/case-studies)
- [LangGraph Security Advisories](https://github.com/langchain-ai/langgraph/security/advisories)
- [CVE-2025-67644](https://nvd.nist.gov/vuln/detail/CVE-2025-67644)
- [CVE-2025-64439 / GHSA-wwqv-p2pp-99h5](https://github.com/advisories/GHSA-wwqv-p2pp-99h5)
- [CVE-2026-28277 / GHSA-g48c-2wqr-h844](https://github.com/advisories/GHSA-g48c-2wqr-h844)
- [2025 Stack Overflow Developer Survey - AI](https://survey.stackoverflow.co/2025/ai)
