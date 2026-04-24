---
title: LangGraph — Research Notes
tags: [research, findings, llm, agents, security]
created: 2026-04-20
---

# LangGraph — Research Notes

## Key Findings

### Topic-native findings

- **[HIGH]** LangGraph v1 is a stability-focused release: core graph primitives and the execution model remain intact, LangChain's `create_agent` runs on top of it, and the old `create_react_agent` prebuilt is deprecated in favor of the LangChain agent API — [LangGraph v1 release notes](https://docs.langchain.com/oss/python/releases/langgraph-v1).
- **[HIGH]** Durable execution is real, but not magical. Official docs require three things for correct replay behavior: a checkpointer, a `thread_id`, and deterministic/idempotent design with side effects wrapped in tasks — [durable execution docs](https://docs.langchain.com/oss/python/langgraph/durable-execution).
- **[HIGH]** LangGraph persists execution as checkpoints at super-step boundaries. That persistence enables human-in-the-loop approvals, time travel, replay, pending writes, and fault recovery — [persistence docs](https://docs.langchain.com/oss/python/langgraph/persistence).
- **[HIGH]** Interrupts are first-class. LangGraph can pause a graph, save state, wait indefinitely, and resume later with a `Command` payload — [human-in-the-loop docs](https://docs.langchain.com/oss/python/langgraph/human-in-the-loop).
- **[HIGH]** LangGraph is usable without LangChain, and there are official Python and JavaScript/TypeScript docs. LangChain is optional convenience, not a hard dependency for the graph model itself — [Python docs](https://docs.langchain.com/oss/python/releases/langgraph-v1), [JS overview](https://docs.langchain.com/oss/javascript/langgraph/overview).
- **[HIGH]** Official deployment/privacy docs distinguish local and deployed behavior clearly: `langgraph dev` stores checkpointing and memory data in a local `.langgraph_api` directory, while `langgraph up` runs an API server plus PostgreSQL and Redis in Docker. If tracing is disabled, no user data leaves the machine unless your own code calls external services — [data storage and privacy docs](https://docs.langchain.com/langsmith/data-storage-and-privacy).
- **[HIGH]** Current public project signals are strong: the repo showed 29.7k stars, 5.1k forks, 502 releases, and a latest visible release of `1.1.8` on April 17, 2026 when checked on 2026-04-20 — [GitHub repo](https://github.com/langchain-ai/langgraph), [releases](https://github.com/langchain-ai/langgraph/releases).
- **[HIGH]** Independent adoption is meaningful but not dominant. Stack Overflow's 2025 survey shows LangGraph at 16.2% among developers building agents, behind Ollama and LangChain — [Stack Overflow 2025](https://survey.stackoverflow.co/2025/ai).
- **[MEDIUM]** Public proof of production use exists, but the strongest public customer list is still partly curated. The official case-studies page explicitly says the list is compiled from public sources and invites community contributions, so treat company logos as directional validation, not a contractual customer ledger — [case studies](https://docs.langchain.com/oss/python/langgraph/case-studies).

### Generalizable patterns

- **[HIGH]** The split between per-thread checkpoints and cross-thread stores is a strong reusable architecture for any workflow engine that needs both in-flight recovery and durable memory.
- **[HIGH]** Super-step checkpointing plus pending writes is a useful pattern for failure recovery in parallel workflows, not only LLM agents.
- **[HIGH]** LangGraph's insistence on deterministic replay is a transferable engineering lesson: if you want reliable resume/replay, isolate side effects and make retry semantics explicit.

### Cross-vertical risks

- **[HIGH]** LangGraph's security history is concentrated around serialization and SQLite-backed checkpoint/storage paths. The repo's current advisory list includes: SQL injection in SQLite filtering, RCE in `JsonPlusSerializer`, SQL injection via metadata filter keys, unsafe BaseCache deserialization, and unsafe msgpack checkpoint loading — [security advisories](https://github.com/langchain-ai/langgraph/security/advisories).
- **[HIGH]** SQLite convenience is an easy footgun. Multiple published advisories only apply when untrusted filter keys or untrusted checkpoint data reach SQLite-backed checkpoint/store implementations, which is exactly the sort of shortcut teams take in demos and internal tools.
- **[MEDIUM]** LangGraph itself is OSS and can stay local, but much of the polished debugging and deployment story in docs still points toward LangSmith and hosted LangChain tooling. That is not lock-in by itself, but it does mean teams should separate "runtime adoption" from "observability/platform adoption."

### Vertical-specific risks

- **[HIGH]** Patch floor currently worth carrying:
  - `langgraph >= 1.0.10` for the unsafe msgpack checkpoint-loading advisory (`GHSA-g48c-2wqr-h844`, CVE-2026-28277) — [GitHub advisory](https://github.com/advisories/GHSA-g48c-2wqr-h844).
  - `langgraph-checkpoint >= 3.0.0` for `JsonPlusSerializer` RCE in `"json"` mode (`GHSA-wwqv-p2pp-99h5`, CVE-2025-64439) — [GitHub advisory](https://github.com/advisories/GHSA-wwqv-p2pp-99h5).
  - `langgraph-checkpoint-sqlite >= 3.0.1` for SQL injection via metadata filter keys (`GHSA-9rwj-6rc7-p77c`, CVE-2025-67644) — [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-67644).
  - `langgraph-checkpoint-sqlite >= 2.0.11` if you directly use the older `SqliteStore` path affected by `GHSA-7p73-8jqx-23r8`, CVE-2025-64104 — [GitHub advisory](https://github.com/advisories/GHSA-7p73-8jqx-23r8).
- **[HIGH]** Official docs state that `async` durability has a small checkpoint-loss risk if the process crashes during execution. For audit-grade or compliance-relevant workflows, use `sync` durability and pay the performance cost — [durable execution docs](https://docs.langchain.com/oss/python/langgraph/durable-execution).
- **[HIGH]** Do not store raw PHI, PII, credentials, or sensitive business records directly in checkpoint state. Store reference IDs and fetch sensitive data from a separately governed store at execution time. LangGraph's checkpoint system is valuable, but it should not become your secret vault.
- **[MEDIUM]** Fresh builds should not center their architecture on `create_react_agent`. Official v1 docs deprecate it in favor of LangChain's `create_agent`, which means legacy tutorials are a migration hazard — [v1 notes](https://docs.langchain.com/oss/python/releases/langgraph-v1).
- **[MEDIUM]** Ecosystem churn has not disappeared. Issue `#6363` documents a breaking change in `langgraph-prebuilt==1.0.2` caused by insufficient version constraints, which is a real ops problem even after 1.0 — [issue #6363](https://github.com/langchain-ai/langgraph/issues/6363).

## Counterarguments & Risks

- LangGraph is lower-level on purpose. That is a strength for custom orchestration and a tax for teams that really only need a reliable tool-calling loop.
- "Production ready" is true only if the team is willing to own checkpoint backends, replay semantics, version pinning, and state hygiene.
- Public adoption evidence is decent, but some of the social-proof layer is still vendor-adjacent or curated from public references rather than hard deployment telemetry.
- This pass did not benchmark LangGraph head-to-head against PydanticAI v1 or Microsoft Agent Framework on the same workload, so any comparative claim beyond high-level positioning should stay cautious.

## Gaps & Unknowns

- I verified the existence of the February 23, 2026 BaseCache RCE advisory (`GHSA-mhr3-j7m5-c7c9`) from the official repo security page, but I did not verify its patched version from the primary advisory page in this pass.
- LangGraph.js/package parity was not deeply audited; only official JS docs and package existence were verified.
- LangGraph Platform / hosted deployment pricing was not investigated here.
- No controlled benchmark on this repo's real workloads was run, so latency/memory claims remain secondary to the architectural analysis.

## Confidence Summary

- HIGH: 15 findings
- MEDIUM: 5 findings
- LOW: 0
- UNVERIFIED: 0

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
- [CVE-2025-64104 / GHSA-7p73-8jqx-23r8](https://github.com/advisories/GHSA-7p73-8jqx-23r8)
- [Issue #6363](https://github.com/langchain-ai/langgraph/issues/6363)
- [2025 Stack Overflow Developer Survey - AI](https://survey.stackoverflow.co/2025/ai)
