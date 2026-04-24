---
title: LangGraph — Verdict
tags: [verdict, recommendation, llm, agents]
created: 2026-04-20
---

# LangGraph — Verdict

## Recommendation

**Adopt when you need custom durable multi-step agent orchestration with explicit state, interrupts, replay, or subgraphs. Skip for simple chat and tool loops unless those controls are already required.**

Rationale, grounded in verified findings:

- LangGraph's real moat is runtime control, not generic "agent magic." Checkpoints, threads, interrupts, super-step replay, and stores are first-class concepts in the official docs — **[HIGH]**.
- LangChain itself now treats LangGraph as the lower-level runtime under `create_agent`, which is a strong signal about where LangGraph fits in the stack — **[HIGH]**.
- The runtime can stay local and self-managed. Official docs describe local disk behavior for `langgraph dev`, Docker/PostgreSQL/Redis behavior for `langgraph up`, and a tracing-off path where no user data leaves the machine unless your own code sends it — **[HIGH]**.
- Independent adoption is meaningful: Stack Overflow 2025 shows LangGraph at 16.2% among agent-building developers — not dominant, but clearly real — **[HIGH]**.
- The main reason not to adopt is not lack of capability. It is the operational tax: deterministic workflow design, backend selection, state hygiene, and active security patching.

Do **not** adopt LangGraph for:

- Single-step inference or straightforward tool-calling loops where provider SDKs or LangChain `create_agent` already solve the problem.
- Teams that do not want to own checkpoint storage, replay semantics, and exact dependency pinning.
- Sensitive regulated workflows if the plan is to persist raw secrets, PHI, or PII directly inside checkpoint state.

## What It Is Not

- **Not a high-level batteries-included app framework.** It is intentionally low-level.
- **Not the cheapest or simplest default.** Its benefits show up only when stateful orchestration matters.
- **Not identical to LangChain.** LangGraph can be used standalone even though LangChain builds on top of it.

## What Is Reusable

- **State-machine-as-graph orchestration** for any long-running workflow that needs branching and resume.
- **Checkpoint/store split** for separating in-flight execution recovery from cross-session memory.
- **Deterministic replay discipline** for any system where retries must not repeat external side effects.

## Future Project Relevance

- Strong fit for future systems that need resumable workflows, approval steps, branching recovery, or graph-level introspection.
- Weak fit for products whose main challenge is prompt quality, single-call latency, or simple provider abstraction.

## Recommendation Invalidation Conditions

- A side-by-side spike shows that LangChain `create_agent`, PydanticAI, Microsoft Agent Framework, or raw SDKs meet the same workflow needs with materially lower ops cost.
- LangGraph's security advisory cadence continues without stronger hardening around checkpoint and serialization paths.
- LangGraph 2.x materially changes API, deployment, or persistence assumptions and removes the current stability benefit.

## Vertical-Specific Constraints

- **Minimum patch floor:** `langgraph >= 1.0.10`, `langgraph-checkpoint >= 3.0.0`, and `langgraph-checkpoint-sqlite >= 3.0.1`. If directly using the older `SqliteStore` path, require `>= 2.0.11`.
- **Checkpoint data hygiene:** Do not store raw PHI, PII, credentials, or sensitive internal records directly in checkpoint state. Persist stable IDs and fetch sensitive data from governed storage.
- **Durability mode:** Use `sync` durability for audit-grade or regulated workflows. Official docs explicitly note a small checkpoint-loss risk in `async`.
- **Backend choice:** SQLite is acceptable for local development and small trusted experiments. For anything shared, persistent, or regulated, move to PostgreSQL early.
- **Tracing/privacy:** Keep tracing off by default during early security review. Turn it on only after deciding what state and prompt content are allowed to leave the runtime boundary.

## Risks & Caveats

- LangGraph is lower-level than many teams expect, so implementation friction is part of the deal, not an anomaly.
- The repo security history is meaningful and concentrated in the same area LangGraph relies on most: persistence and serialization.
- Some production-validation evidence is public but curated; the case-study page is useful, not dispositive.
- Packaging churn around `langgraph-prebuilt` shows that the ecosystem still needs exact version pinning even after 1.0.
- The official docs are strong on concepts, but they do not replace benchmarking on your own workflow.

## Next Steps

1. Build one real workflow with a checkpoint, interrupt, and resume path. If that spike does not clearly outperform a simpler implementation, stop there.
2. Pin exact versions and set a hard floor: `langgraph >= 1.0.10`, `langgraph-checkpoint >= 3.0.0`, `langgraph-checkpoint-sqlite >= 3.0.1`, plus `SqliteStore >= 2.0.11` if used directly.
3. Use PostgreSQL for anything beyond local development, keep tracing off until reviewed, and strip secrets/PII from state.
4. Compare against LangChain `create_agent` before committing to raw LangGraph. If the higher-level agent API is enough, take the simpler path.
5. If this is a procurement-level decision, run a short side-by-side spike against PydanticAI v1 or Microsoft Agent Framework instead of assuming LangGraph wins by default.

## Runner-Up / Alternatives

- **LangChain `create_agent`:** prefer when you want LangGraph's runtime under a higher-level interface.
- **PydanticAI:** prefer if typed ergonomics and a narrower runtime are more important than LangGraph's explicit graph model.
- **Microsoft Agent Framework:** worth checking when enterprise platform alignment and Microsoft ecosystem fit matter.
- **Raw provider SDKs:** prefer for simple chat, single-step tool calling, or low-overhead flows.

## Quality Scorecard

| Dimension | Weight | Score | |-----------|:------:|:-----:| | Evidence Quality | 20% | 9 | | Actionability | 20% | 9 | | Accuracy | 15% | 9 | | Completeness | 15% | 8 | | Objectivity | 10% | 9 | | Clarity | 10% | 9 | | Risk Awareness | 5% | 9 | | Conciseness | 5% | 8 | | **Weighted Total** | — | **8.85 / 10** |

**Final verdict: PASS** — with explicit caveats on security patching, state hygiene, and scope discipline.

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
