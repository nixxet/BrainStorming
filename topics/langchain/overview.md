---
title: LangChain
tags: [research, framework, llm, agents]
created: 2026-04-19
status: complete
---

# LangChain

## What It Is

LangChain is an open-source Python (and TypeScript) framework for composing LLM-powered applications, paired with LangGraph (a stateful agent runtime) and LangSmith (commercial observability SaaS). As of 1.0 GA on October 22, 2025, it is best understood as three products: an integration/composition layer (LangChain core), a graph-based durable agent runtime (LangGraph), and a hosted tracing/eval platform (LangSmith).

## Source Domain

- **Native context:** Python LLM application framework and AI agent orchestration ecosystem, aimed at developers building retrieval, tool-use, and multi-step agent workflows on top of heterogeneous model providers.
- **Why that context matters:** Its design assumes developer-facing composition of LLM calls, tool calls, and retrieval. Much of its API surface, security model, and cost model only make sense inside that lifecycle.

## Generalizable Value

- **Reusable pattern:** A unified "Runnable" interface with pipe-operator (`|`) composition into streaming/async/batch-capable DAGs is a general middleware composition pattern. The state-machine-as-graph model in LangGraph is a general durable-workflow pattern.
- **Cross-vertical relevance:** The composition primitives, the durable graph runtime pattern, and the security lessons (default-unsafe config, credential aggregation points, prompt injection into deserialization) transfer to any orchestration middleware — not only LLM apps.

## Key Concepts

- **Runnable protocol:** Every LangChain component implements `invoke`, `batch`, `stream`, `ainvoke`; LCEL composes them with `|` into `RunnableSequence` / `RunnableParallel`.
- **LCEL:** LangChain Expression Language — the pipe-based DAG composition layer providing streaming, async, and batching by default.
- **LangGraph:** Separate MIT-licensed framework modeling agents as `StateGraph` with nodes and conditional/parallel edges; supports checkpoints, human-in-the-loop, and persistent memory.
- **`create_agent` API:** The 1.0-era agent entry point, backed by LangGraph, replacing the removed `AgentExecutor`.
- **Middleware system:** Standard content blocks and structured output in the core loop, introduced in 1.0.
- **`langchain-classic`:** Backward-compatibility package for pre-1.0 APIs (notably `AgentExecutor`).
- **LangSmith:** Commercial hosted observability, tracing, and evaluation platform; not required to run LangChain or LangGraph.
- **Package split:** langchain-core, langchain, partner packages (OpenAI, Anthropic, Google, etc.), and langchain-community.

## Context

- Used by developers building RAG pipelines, tool-using agents, and multi-step stateful agent workflows.
- Adopted most heavily by teams that value breadth of provider and vector-store integrations over minimal framework overhead.
- Most relevant when the workflow is genuinely multi-step and stateful (LangGraph) or needs broad integration coverage (LangChain core); less relevant for single-step inference where provider SDKs suffice.

## Key Numbers / Stats

- LangChain 1.0 GA on October 22, 2025, alongside LangGraph 1.0 and a $125M Series B at a $1.25B valuation ([LangChain blog](https://blog.langchain.com/langchain-1-0/)) — **[HIGH]** confidence.
- Stack Overflow 2025 Developer Survey (n=48,893): LangChain is the #2 agent orchestration framework at 32.9% adoption among developers actively building agents; LangGraph separately at 16.2%. Only ~7.7% of all surveyed developers build AI agents, so population-wide LangChain penetration is roughly 15–16% of professional developers ([Stack Overflow 2025 Survey](https://survey.stackoverflow.co/2025/)) — **[HIGH]** confidence.
- 100+ vector store integrations and 50+ LLM provider packages across langchain-core, langchain, partner packages, and langchain-community ([LangChain docs](https://python.langchain.com/docs/integrations/)) — **[HIGH]** confidence.
- 110K+ GitHub stars; ~28M monthly PyPI downloads for `langchain`; ~98M monthly downloads for `langchain-core` (includes transitive dependencies); LangGraph ~34.5M monthly ([GitHub](https://github.com/langchain-ai/langchain), PyPI stats) — **[MEDIUM]** confidence; these are ceiling estimates and vanity metrics, not production deployment counts.
- LangSmith reached $16M ARR with 1,000 customers as of October 2025, vendor-reported via getlatka.com; [TechCrunch](https://techcrunch.com/) corroborates valuation context — **[MEDIUM]** confidence.

## Sources

- [LangChain GitHub](https://github.com/langchain-ai/langchain)
- [LangChain 1.0 Announcement](https://blog.langchain.com/langchain-1-0/)
- [LangChain Python Docs](https://python.langchain.com/)
- [LangGraph Docs](https://docs.langchain.com/langgraph)
- [LangSmith Pricing](https://www.langchain.com/pricing)
- [Stack Overflow 2025 Developer Survey](https://survey.stackoverflow.co/2025/)
